from datetime import date

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from financas.models import Transacao
from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/transacoes/"
NOV = date(2026, 11, 10)


def payload(categoria, **extra):
    return {"categoria": categoria.pk, "descricao": "Compra", "valor": "10.00", "data": "2026-11-10", **extra}


@pytest.mark.django_db
class TestCampo:
    def test_padrao_nao_informado(self, cliente_logado, usuario):
        resposta = cliente_logado.post(URL, payload(criar_categoria(usuario)), format="json")
        assert resposta.status_code == 201
        assert resposta.json()["forma_pagamento"] == "NAO_INFORMADO"
        assert resposta.json()["forma_pagamento_rotulo"] == "Não informado"

    def test_aceita_forma_valida(self, cliente_logado, usuario):
        resposta = cliente_logado.post(URL, payload(criar_categoria(usuario), forma_pagamento="PIX"), format="json")
        assert resposta.status_code == 201
        assert resposta.json()["forma_pagamento"] == "PIX"
        assert resposta.json()["forma_pagamento_rotulo"] == "Pix"

    def test_forma_invalida(self, cliente_logado, usuario):
        resposta = cliente_logado.post(URL, payload(criar_categoria(usuario), forma_pagamento="CHEQUE"), format="json")
        assert resposta.status_code == 400
        assert "forma_pagamento" in resposta.json()

    def test_editar_forma(self, cliente_logado, usuario):
        transacao = criar_transacao(criar_categoria(usuario))
        resposta = cliente_logado.patch(f"{URL}{transacao.pk}/", {"forma_pagamento": "BOLETO"}, format="json")
        assert resposta.status_code == 200
        transacao.refresh_from_db()
        assert transacao.forma_pagamento == "BOLETO"


@pytest.mark.django_db
class TestFiltro:
    def test_filtra_por_forma(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        criar_transacao(categoria, descricao="No pix", forma_pagamento="PIX")
        criar_transacao(categoria, descricao="No cartão", forma_pagamento="CARTAO_CREDITO")
        corpo = cliente_logado.get(URL, {"forma_pagamento": "PIX"}).json()
        assert [t["descricao"] for t in corpo["results"]] == ["No pix"]
        assert corpo["totais"]["despesas"] == "10.00"

    def test_filtro_invalido(self, cliente_logado):
        resposta = cliente_logado.get(URL, {"forma_pagamento": "CHEQUE"})
        assert resposta.status_code == 400
        assert "forma_pagamento" in resposta.json()


@pytest.mark.django_db
class TestResumoPorForma:
    def test_totais_e_percentuais(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado")
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(mercado, valor="0.10", data=NOV, forma_pagamento="PIX")
        criar_transacao(mercado, valor="0.20", data=NOV, forma_pagamento="PIX")
        criar_transacao(mercado, valor="0.50", data=NOV, forma_pagamento="CARTAO_DEBITO")
        criar_transacao(mercado, valor="0.40", data=NOV)  # não informado
        criar_transacao(mercado, valor="99.00", data=date(2026, 10, 31), forma_pagamento="PIX")  # outro mês
        criar_transacao(salario, valor="1000.00", data=NOV, forma_pagamento="TRANSFERENCIA")  # receita não entra

        corpo = cliente_logado.get("/api/resumo/", {"mes": "2026-11"}).json()

        assert corpo["despesas_por_forma"] == [
            {"forma": "CARTAO_DEBITO", "rotulo": "Cartão de débito", "total": "0.50", "percentual": "41.67"},
            {"forma": "PIX", "rotulo": "Pix", "total": "0.30", "percentual": "25.00"},
            {"forma": "NAO_INFORMADO", "rotulo": "Não informado", "total": "0.40", "percentual": "33.33"},
        ]

    def test_mes_sem_despesas(self, cliente_logado):
        assert cliente_logado.get("/api/resumo/", {"mes": "2026-11"}).json()["despesas_por_forma"] == []

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00", data=NOV, forma_pagamento="PIX")
        assert cliente_logado.get("/api/resumo/", {"mes": "2026-11"}).json()["despesas_por_forma"] == []


@pytest.mark.django_db(transaction=True)
def test_migration_preenche_transacoes_existentes_com_nao_informado():
    executor = MigrationExecutor(connection)
    antes = [("financas", "0003_categoria_limite_mensal")]
    depois = [("financas", "0004_transacao_forma_pagamento")]
    executor.migrate(antes)
    apps_antes = executor.loader.project_state(antes).apps
    User = apps_antes.get_model("auth", "User")
    Categoria = apps_antes.get_model("financas", "Categoria")
    TransacaoAntiga = apps_antes.get_model("financas", "Transacao")
    usuario = User.objects.create(username="antigo")
    categoria = Categoria.objects.create(usuario=usuario, nome="Mercado", tipo="DESPESA")
    TransacaoAntiga.objects.create(categoria=categoria, descricao="Antiga", valor="10.00", data=NOV)

    executor = MigrationExecutor(connection)
    executor.migrate(depois)
    TransacaoNova = executor.loader.project_state(depois).apps.get_model("financas", "Transacao")
    assert TransacaoNova.objects.get(descricao="Antiga").forma_pagamento == "NAO_INFORMADO"

    # Volta ao estado mais recente para os outros testes.
    executor = MigrationExecutor(connection)
    executor.migrate(executor.loader.graph.leaf_nodes())
    assert Transacao.objects.count() == 1
