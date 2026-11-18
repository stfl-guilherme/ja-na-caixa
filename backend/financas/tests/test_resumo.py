from datetime import date

import pytest
from django.utils import timezone

from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/resumo/"


@pytest.mark.django_db
class TestResumo:
    def test_totais_do_mes(self, cliente_logado, usuario):
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA", cor="#16A34A")
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA", cor="#22C55E")
        lazer = criar_categoria(usuario, nome="Lazer", tipo="DESPESA", cor="#A855F7")
        criar_transacao(salario, valor="4500.00", data=date(2026, 11, 5))
        criar_transacao(mercado, valor="820.30", data=date(2026, 11, 6))
        criar_transacao(mercado, valor="100.00", data=date(2026, 11, 20))
        criar_transacao(lazer, valor="1390.15", data=date(2026, 11, 30))
        criar_transacao(mercado, valor="999.99", data=date(2026, 10, 31))  # fora do mês

        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()

        assert corpo["mes"] == "2026-11"
        assert corpo["receitas"] == "4500.00"
        assert corpo["despesas"] == "2310.45"
        assert corpo["saldo"] == "2189.55"
        assert corpo["por_categoria"] == [
            {"categoria_id": salario.pk, "nome": "Salário", "cor": "#16A34A", "tipo": "RECEITA", "total": "4500.00"},
            {"categoria_id": lazer.pk, "nome": "Lazer", "cor": "#A855F7", "tipo": "DESPESA", "total": "1390.15"},
            {"categoria_id": mercado.pk, "nome": "Mercado", "cor": "#22C55E", "tipo": "DESPESA", "total": "920.30"},
        ]

    def test_precisao_decimal(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario)
        criar_transacao(mercado, valor="0.10")
        criar_transacao(mercado, valor="0.20")
        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()
        assert corpo["despesas"] == "0.30"
        assert corpo["saldo"] == "-0.30"

    def test_mes_sem_transacoes(self, cliente_logado):
        corpo = cliente_logado.get(URL, {"mes": "2020-01"}).json()
        assert corpo == {
            "mes": "2020-01",
            "receitas": "0.00",
            "despesas": "0.00",
            "saldo": "0.00",
            "por_categoria": [],
        }

    def test_sem_mes_usa_mes_atual(self, cliente_logado, usuario):
        hoje = timezone.localdate()
        criar_transacao(criar_categoria(usuario), valor="5.00", data=hoje)
        corpo = cliente_logado.get(URL).json()
        assert corpo["mes"] == hoje.strftime("%Y-%m")
        assert corpo["despesas"] == "5.00"

    def test_mes_invalido(self, cliente_logado):
        resposta = cliente_logado.get(URL, {"mes": "2026-13"})
        assert resposta.status_code == 400
        assert "mes" in resposta.json()

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00")
        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()
        assert corpo["despesas"] == "0.00"
        assert corpo["por_categoria"] == []


@pytest.mark.django_db
def test_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
