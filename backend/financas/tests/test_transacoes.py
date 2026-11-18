from datetime import date

import pytest

from financas.models import Transacao
from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/transacoes/"


def url_item(pk: int) -> str:
    return f"{URL}{pk}/"


def payload(categoria, **extra):
    dados = {
        "categoria": categoria.pk,
        "descricao": "Supermercado",
        "valor": "123.45",
        "data": "2026-11-10",
        "observacao": "",
    }
    dados.update(extra)
    return dados


def resultados(resposta):
    return resposta.json()["results"]


@pytest.mark.django_db
class TestCrudTransacoes:
    def test_criar(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Mercado", cor="#22C55E")
        resposta = cliente_logado.post(URL, payload(categoria), format="json")
        assert resposta.status_code == 201
        corpo = resposta.json()
        assert corpo["valor"] == "123.45"
        assert corpo["categoria"] == categoria.pk
        assert corpo["categoria_nome"] == "Mercado"
        assert corpo["categoria_cor"] == "#22C55E"
        assert corpo["tipo"] == "DESPESA"
        assert corpo["data"] == "2026-11-10"

    def test_observacao_opcional(self, cliente_logado, usuario):
        dados = payload(criar_categoria(usuario))
        del dados["observacao"]
        assert cliente_logado.post(URL, dados, format="json").status_code == 201

    def test_detalhar_atualizar_excluir(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        transacao = criar_transacao(categoria)
        assert cliente_logado.get(url_item(transacao.pk)).status_code == 200
        resposta = cliente_logado.patch(url_item(transacao.pk), {"valor": "99.90"}, format="json")
        assert resposta.status_code == 200
        assert resposta.json()["valor"] == "99.90"
        resposta = cliente_logado.put(url_item(transacao.pk), payload(categoria, descricao="Feira"), format="json")
        assert resposta.status_code == 200
        assert resposta.json()["descricao"] == "Feira"
        assert cliente_logado.delete(url_item(transacao.pk)).status_code == 204
        assert not Transacao.objects.exists()

    @pytest.mark.parametrize("valor", ["0", "0.00", "-10.00"])
    def test_valor_nao_positivo_rejeitado(self, cliente_logado, usuario, valor):
        resposta = cliente_logado.post(URL, payload(criar_categoria(usuario), valor=valor), format="json")
        assert resposta.status_code == 400
        assert "valor" in resposta.json()

    def test_valor_com_mais_de_duas_casas_rejeitado(self, cliente_logado, usuario):
        resposta = cliente_logado.post(URL, payload(criar_categoria(usuario), valor="1.234"), format="json")
        assert resposta.status_code == 400

    def test_campos_obrigatorios(self, cliente_logado):
        resposta = cliente_logado.post(URL, {}, format="json")
        assert resposta.status_code == 400
        assert {"categoria", "descricao", "valor", "data"} <= set(resposta.json())

    def test_categoria_de_outro_usuario_rejeitada(self, cliente_logado, outro_usuario):
        alheia = criar_categoria(outro_usuario)
        resposta = cliente_logado.post(URL, payload(alheia), format="json")
        assert resposta.status_code == 400
        assert "categoria" in resposta.json()
        assert not Transacao.objects.exists()

    def test_mover_para_categoria_de_outro_usuario_rejeitado(self, cliente_logado, usuario, outro_usuario):
        transacao = criar_transacao(criar_categoria(usuario))
        alheia = criar_categoria(outro_usuario)
        resposta = cliente_logado.patch(url_item(transacao.pk), {"categoria": alheia.pk}, format="json")
        assert resposta.status_code == 400

    def test_ordem_data_e_id_decrescentes(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        a = criar_transacao(categoria, data=date(2026, 11, 1))
        b = criar_transacao(categoria, data=date(2026, 11, 5))
        c = criar_transacao(categoria, data=date(2026, 11, 5))
        ids = [t["id"] for t in resultados(cliente_logado.get(URL))]
        assert ids == [c.pk, b.pk, a.pk]


@pytest.mark.django_db
class TestIsolamentoTransacoes:
    def test_outro_usuario_recebe_404(self, cliente_logado, outro_usuario):
        alheia = criar_transacao(criar_categoria(outro_usuario))
        assert cliente_logado.get(url_item(alheia.pk)).status_code == 404
        assert cliente_logado.patch(url_item(alheia.pk), {"valor": "1.00"}, format="json").status_code == 404
        assert cliente_logado.delete(url_item(alheia.pk)).status_code == 404
        alheia.refresh_from_db()
        assert str(alheia.valor) == "10.00"

    def test_listagem_nao_mostra_dados_de_outro_usuario(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario))
        assert resultados(cliente_logado.get(URL)) == []


@pytest.mark.django_db
def test_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
    assert api_client.post(URL, {}, format="json").status_code == 401


@pytest.mark.django_db
class TestFiltrosTransacoes:
    def test_filtro_mes(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        criar_transacao(categoria, data=date(2026, 10, 31), descricao="Outubro")
        criar_transacao(categoria, data=date(2026, 11, 1), descricao="Início")
        criar_transacao(categoria, data=date(2026, 11, 30), descricao="Fim")
        criar_transacao(categoria, data=date(2026, 12, 1), descricao="Dezembro")
        nomes = [t["descricao"] for t in resultados(cliente_logado.get(URL, {"mes": "2026-11"}))]
        assert nomes == ["Fim", "Início"]

    @pytest.mark.parametrize("mes", ["2026-13", "2026/11", "novembro", "2026-1"])
    def test_mes_invalido(self, cliente_logado, mes):
        resposta = cliente_logado.get(URL, {"mes": mes})
        assert resposta.status_code == 400
        assert "mes" in resposta.json()

    def test_filtro_categoria(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado")
        lazer = criar_categoria(usuario, nome="Lazer")
        criar_transacao(mercado, descricao="Arroz")
        criar_transacao(lazer, descricao="Cinema")
        nomes = [t["descricao"] for t in resultados(cliente_logado.get(URL, {"categoria": lazer.pk}))]
        assert nomes == ["Cinema"]

    def test_filtro_tipo(self, cliente_logado, usuario):
        criar_transacao(criar_categoria(usuario, nome="Salário", tipo="RECEITA"), descricao="Pagamento")
        criar_transacao(criar_categoria(usuario, nome="Mercado"), descricao="Arroz")
        nomes = [t["descricao"] for t in resultados(cliente_logado.get(URL, {"tipo": "RECEITA"}))]
        assert nomes == ["Pagamento"]

    def test_busca_sem_diferenciar_maiusculas(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        criar_transacao(categoria, descricao="Padaria do Zé")
        criar_transacao(categoria, descricao="Mercado")
        nomes = [t["descricao"] for t in resultados(cliente_logado.get(URL, {"busca": "PADARIA"}))]
        assert nomes == ["Padaria do Zé"]

    def test_paginacao_20_por_pagina(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        for i in range(25):
            criar_transacao(categoria, descricao=f"T{i}")
        pagina1 = cliente_logado.get(URL).json()
        assert pagina1["count"] == 25
        assert len(pagina1["results"]) == 20
        assert pagina1["next"] is not None
        pagina2 = cliente_logado.get(URL, {"page": 2}).json()
        assert len(pagina2["results"]) == 5
        assert pagina2["previous"] is not None


@pytest.mark.django_db
class TestTotaisDaListagem:
    def test_totais_somam_todas_as_paginas(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        for dia in range(1, 25):
            criar_transacao(mercado, valor="10.05", data=date(2026, 11, dia))
        criar_transacao(salario, valor="5200.00", data=date(2026, 11, 1))

        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()

        assert len(corpo["results"]) == 20
        assert corpo["count"] == 25
        assert corpo["totais"] == {"receitas": "5200.00", "despesas": "241.20", "saldo": "4958.80"}

    def test_totais_respeitam_filtros(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        lazer = criar_categoria(usuario, nome="Lazer", tipo="DESPESA")
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(mercado, valor="100.00", descricao="Feira", data=date(2026, 11, 2))
        criar_transacao(lazer, valor="50.00", descricao="Cinema", data=date(2026, 11, 3))
        criar_transacao(salario, valor="900.00", descricao="Salário", data=date(2026, 11, 4))
        criar_transacao(mercado, valor="7.00", descricao="Feira", data=date(2026, 10, 4))

        def totais(**filtros):
            return cliente_logado.get(URL, {"mes": "2026-11", **filtros}).json()["totais"]

        assert totais(tipo="DESPESA") == {"receitas": "0.00", "despesas": "150.00", "saldo": "-150.00"}
        assert totais(categoria=lazer.pk)["despesas"] == "50.00"
        assert totais(busca="feira")["despesas"] == "100.00"
        assert totais(busca="nada disso") == {"receitas": "0.00", "despesas": "0.00", "saldo": "0.00"}

    def test_totais_por_dia_da_pagina(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(salario, valor="100.00", data=date(2026, 11, 17))
        criar_transacao(mercado, valor="0.10", data=date(2026, 11, 17))
        criar_transacao(mercado, valor="0.20", data=date(2026, 11, 17))
        criar_transacao(mercado, valor="49.90", data=date(2026, 11, 15))
        for _ in range(20):  # 16 cabem na página 1; 4 vão para a página 2
            criar_transacao(mercado, valor="1.00", data=date(2026, 11, 14))

        pagina1 = cliente_logado.get(URL, {"mes": "2026-11"}).json()
        datas_da_pagina = sorted({t["data"] for t in pagina1["results"]}, reverse=True)

        assert [d["data"] for d in pagina1["totais_por_dia"]] == datas_da_pagina
        assert pagina1["totais_por_dia"][0] == {"data": "2026-11-17", "saldo": "99.70"}
        assert pagina1["totais_por_dia"][1] == {"data": "2026-11-15", "saldo": "-49.90"}
        # O dia 14 tem 20 transações divididas entre as páginas; o total do dia considera todas.
        assert pagina1["totais_por_dia"][2] == {"data": "2026-11-14", "saldo": "-20.00"}

    def test_isolamento(self, cliente_logado, usuario, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00", data=date(2026, 11, 3))
        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()
        assert corpo["totais"]["despesas"] == "0.00"
        assert corpo["totais_por_dia"] == []
