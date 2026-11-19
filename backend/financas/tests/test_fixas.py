from datetime import date

import pytest

from financas.models import Transacao
from financas.tests.factories import criar_categoria, criar_transacao

URL_LISTA = "/api/transacoes/fixas-para-repetir/"
URL_REPETIR = "/api/transacoes/repetir-fixas/"


def repetir(cliente, mes, ids):
    return cliente.post(URL_REPETIR, {"mes": mes, "ids": ids}, format="json")


@pytest.fixture
def aluguel(usuario):
    moradia = criar_categoria(usuario, nome="Moradia")
    return criar_transacao(
        moradia,
        valor="1200.00",
        data=date(2026, 10, 9),
        descricao="Aluguel",
        fixa=True,
        forma_pagamento="BOLETO",
        observacao="Apartamento",
    )


@pytest.mark.django_db
class TestCampoFixa:
    def test_crud_aceita_fixa(self, cliente_logado, usuario):
        resposta = cliente_logado.post(
            "/api/transacoes/",
            {"categoria": criar_categoria(usuario).pk, "descricao": "Internet", "valor": "99.00", "data": "2026-11-15", "fixa": True},
            format="json",
        )
        assert resposta.status_code == 201
        assert resposta.json()["fixa"] is True
        assert resposta.json()["repetida_de"] is None

    def test_padrao_nao_fixa(self, cliente_logado, usuario):
        resposta = cliente_logado.post(
            "/api/transacoes/",
            {"categoria": criar_categoria(usuario).pk, "descricao": "Pizza", "valor": "60.00", "data": "2026-11-15"},
            format="json",
        )
        assert resposta.json()["fixa"] is False

    def test_repetida_de_e_somente_leitura(self, cliente_logado, usuario, aluguel):
        transacao = criar_transacao(aluguel.categoria, data=date(2026, 11, 1))
        cliente_logado.patch(f"/api/transacoes/{transacao.pk}/", {"repetida_de": aluguel.pk}, format="json")
        transacao.refresh_from_db()
        assert transacao.repetida_de is None


@pytest.mark.django_db
class TestFixasParaRepetir:
    def test_lista_fixas_do_mes_anterior_com_data_sugerida(self, cliente_logado, usuario, aluguel):
        criar_transacao(aluguel.categoria, data=date(2026, 10, 20), descricao="Conserto")  # não fixa
        criar_transacao(aluguel.categoria, data=date(2026, 9, 9), descricao="Antiga", fixa=True)  # outro mês
        corpo = cliente_logado.get(URL_LISTA, {"mes": "2026-11"}).json()
        assert [(t["id"], t["descricao"], t["data_sugerida"]) for t in corpo] == [(aluguel.pk, "Aluguel", "2026-11-09")]
        assert corpo[0]["categoria_nome"] == "Moradia"
        assert corpo[0]["valor"] == "1200.00"

    def test_some_depois_de_repetir(self, cliente_logado, aluguel):
        repetir(cliente_logado, "2026-11", [aluguel.pk])
        assert cliente_logado.get(URL_LISTA, {"mes": "2026-11"}).json() == []

    def test_data_sugerida_no_fim_do_mes(self, cliente_logado, usuario):
        conta = criar_transacao(criar_categoria(usuario), data=date(2027, 1, 31), fixa=True)
        corpo = cliente_logado.get(URL_LISTA, {"mes": "2027-02"}).json()
        assert [(t["id"], t["data_sugerida"]) for t in corpo] == [(conta.pk, "2027-02-28")]

    def test_mes_obrigatorio_e_valido(self, cliente_logado):
        assert cliente_logado.get(URL_LISTA).status_code == 400
        assert "mes" in cliente_logado.get(URL_LISTA, {"mes": "2026-13"}).json()

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), data=date(2026, 10, 5), fixa=True)
        assert cliente_logado.get(URL_LISTA, {"mes": "2026-11"}).json() == []


@pytest.mark.django_db
class TestRepetirFixas:
    def test_copia_todos_os_campos(self, cliente_logado, aluguel):
        resposta = repetir(cliente_logado, "2026-11", [aluguel.pk])
        assert resposta.status_code == 201
        [criada] = resposta.json()
        copia = Transacao.objects.get(pk=criada["id"])
        assert copia.pk != aluguel.pk
        assert copia.categoria_id == aluguel.categoria_id
        assert copia.descricao == "Aluguel"
        assert str(copia.valor) == "1200.00"
        assert copia.forma_pagamento == "BOLETO"
        assert copia.observacao == "Apartamento"
        assert copia.data == date(2026, 11, 9)
        assert copia.fixa is True
        assert copia.repetida_de_id == aluguel.pk
        assert criada["repetida_de"] == aluguel.pk

    @pytest.mark.parametrize(("ano", "esperado"), [(2027, date(2027, 2, 28)), (2028, date(2028, 2, 29))])
    def test_fim_de_mes_e_ano_bissexto(self, cliente_logado, usuario, ano, esperado):
        conta = criar_transacao(criar_categoria(usuario), data=date(ano, 1, 31), fixa=True)
        resposta = repetir(cliente_logado, f"{ano}-02", [conta.pk])
        assert resposta.status_code == 201
        assert resposta.json()[0]["data"] == esperado.isoformat()

    def test_idempotente(self, cliente_logado, aluguel):
        assert len(repetir(cliente_logado, "2026-11", [aluguel.pk]).json()) == 1
        segunda = repetir(cliente_logado, "2026-11", [aluguel.pk])
        assert segunda.status_code == 201
        assert segunda.json() == []
        assert Transacao.objects.filter(repetida_de=aluguel).count() == 1

    def test_ids_de_outro_usuario(self, cliente_logado, outro_usuario, aluguel):
        alheia = criar_transacao(criar_categoria(outro_usuario), data=date(2026, 10, 5), fixa=True)
        resposta = repetir(cliente_logado, "2026-11", [aluguel.pk, alheia.pk])
        assert resposta.status_code == 400
        assert "ids" in resposta.json()
        assert not Transacao.objects.filter(repetida_de__isnull=False).exists()

    def test_nao_fixa(self, cliente_logado, aluguel):
        avulsa = criar_transacao(aluguel.categoria, data=date(2026, 10, 20))
        resposta = repetir(cliente_logado, "2026-11", [avulsa.pk])
        assert resposta.status_code == 400
        assert "ids" in resposta.json()

    def test_fora_do_mes_anterior(self, cliente_logado, aluguel):
        resposta = repetir(cliente_logado, "2026-12", [aluguel.pk])
        assert resposta.status_code == 400
        assert "ids" in resposta.json()

    def test_inexistente(self, cliente_logado):
        assert repetir(cliente_logado, "2026-11", [999999]).status_code == 400

    @pytest.mark.parametrize("ids", [[], "1", None, ["a"], [True]])
    def test_ids_invalidos(self, cliente_logado, ids):
        resposta = repetir(cliente_logado, "2026-11", ids)
        assert resposta.status_code == 400
        assert "ids" in resposta.json()

    def test_mes_invalido(self, cliente_logado, aluguel):
        resposta = repetir(cliente_logado, "2026-13", [aluguel.pk])
        assert resposta.status_code == 400
        assert "mes" in resposta.json()

    def test_virada_de_ano(self, cliente_logado, usuario):
        conta = criar_transacao(criar_categoria(usuario), data=date(2026, 12, 15), fixa=True)
        resposta = repetir(cliente_logado, "2027-01", [conta.pk])
        assert resposta.status_code == 201
        assert resposta.json()[0]["data"] == "2027-01-15"

    def test_excluir_a_original_nao_apaga_a_copia(self, cliente_logado, aluguel):
        copia_id = repetir(cliente_logado, "2026-11", [aluguel.pk]).json()[0]["id"]
        assert cliente_logado.delete(f"/api/transacoes/{aluguel.pk}/").status_code == 204
        copia = Transacao.objects.get(pk=copia_id)
        assert copia.repetida_de is None

    def test_sem_login(self, api_client):
        assert api_client.post(URL_REPETIR, {"mes": "2026-11", "ids": [1]}, format="json").status_code == 401
        assert api_client.get(URL_LISTA, {"mes": "2026-11"}).status_code == 401
