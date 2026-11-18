from datetime import date

import pytest
from django.utils import timezone

from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/resumo/anual/"


def _zerado(mes: str) -> dict:
    return {"mes": mes, "receitas": "0.00", "despesas": "0.00", "saldo": "0.00"}


@pytest.mark.django_db
class TestResumoAnual:
    def test_doze_meses_com_totais(self, cliente_logado, usuario):
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        criar_transacao(salario, valor="6100.00", data=date(2026, 1, 5))
        criar_transacao(mercado, valor="4890.00", data=date(2026, 1, 31))
        criar_transacao(mercado, valor="105.60", data=date(2026, 10, 1))
        criar_transacao(salario, valor="1.00", data=date(2025, 12, 31))  # outro ano
        criar_transacao(salario, valor="2.00", data=date(2027, 1, 1))  # outro ano

        corpo = cliente_logado.get(URL, {"ano": "2026"}).json()

        assert corpo["ano"] == 2026
        assert [m["mes"] for m in corpo["meses"]] == [f"2026-{n:02d}" for n in range(1, 13)]
        assert corpo["meses"][0] == {"mes": "2026-01", "receitas": "6100.00", "despesas": "4890.00", "saldo": "1210.00"}
        assert corpo["meses"][9] == {"mes": "2026-10", "receitas": "0.00", "despesas": "105.60", "saldo": "-105.60"}
        assert corpo["meses"][11] == _zerado("2026-12")
        assert (corpo["receitas"], corpo["despesas"], corpo["saldo"]) == ("6100.00", "4995.60", "1104.40")

    def test_ano_sem_transacoes(self, cliente_logado):
        corpo = cliente_logado.get(URL, {"ano": "2020"}).json()
        assert corpo == {
            "ano": 2020,
            "receitas": "0.00",
            "despesas": "0.00",
            "saldo": "0.00",
            "meses": [_zerado(f"2020-{n:02d}") for n in range(1, 13)],
        }

    def test_precisao_decimal(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario)
        criar_transacao(mercado, valor="0.10", data=date(2026, 3, 1))
        criar_transacao(mercado, valor="0.20", data=date(2026, 3, 31))
        corpo = cliente_logado.get(URL, {"ano": "2026"}).json()
        assert corpo["meses"][2]["despesas"] == "0.30"
        assert corpo["despesas"] == "0.30"

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00", data=date(2026, 5, 3))
        corpo = cliente_logado.get(URL, {"ano": "2026"}).json()
        assert corpo["despesas"] == "0.00"
        assert all(m["despesas"] == "0.00" for m in corpo["meses"])

    def test_sem_ano_usa_ano_atual(self, cliente_logado):
        assert cliente_logado.get(URL).json()["ano"] == timezone.localdate().year

    @pytest.mark.parametrize("ano", ["26", "abcd", "0000", "20266", "-2026"])
    def test_ano_invalido(self, cliente_logado, ano):
        resposta = cliente_logado.get(URL, {"ano": ano})
        assert resposta.status_code == 400
        assert "ano" in resposta.json()


@pytest.mark.django_db
def test_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
