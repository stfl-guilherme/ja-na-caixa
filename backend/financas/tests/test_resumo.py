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
            {"categoria_id": salario.pk, "nome": "Salário", "cor": "#16A34A", "tipo": "RECEITA", "total": "4500.00", "quantidade": 1},
            {"categoria_id": lazer.pk, "nome": "Lazer", "cor": "#A855F7", "tipo": "DESPESA", "total": "1390.15", "quantidade": 1},
            {"categoria_id": mercado.pk, "nome": "Mercado", "cor": "#22C55E", "tipo": "DESPESA", "total": "920.30", "quantidade": 2},
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
        campos_antigos = {k: corpo[k] for k in ("mes", "receitas", "despesas", "saldo", "por_categoria")}
        assert campos_antigos == {
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


@pytest.mark.django_db
class TestSerieDiaria:
    def test_um_item_por_dia_do_mes(self, cliente_logado):
        novembro = cliente_logado.get(URL, {"mes": "2026-11"}).json()["serie_diaria"]
        assert [d["data"] for d in novembro] == [f"2026-11-{dia:02d}" for dia in range(1, 31)]
        fevereiro_bissexto = cliente_logado.get(URL, {"mes": "2028-02"}).json()["serie_diaria"]
        assert len(fevereiro_bissexto) == 29

    def test_valores_e_saldo_acumulado(self, cliente_logado, usuario):
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        criar_transacao(salario, valor="5200.00", data=date(2026, 11, 1))
        criar_transacao(mercado, valor="1450.00", data=date(2026, 11, 1))
        criar_transacao(mercado, valor="380.00", data=date(2026, 11, 2))
        criar_transacao(mercado, valor="23.90", data=date(2026, 11, 4))
        criar_transacao(mercado, valor="999.00", data=date(2026, 10, 31))  # fora do mês

        serie = cliente_logado.get(URL, {"mes": "2026-11"}).json()["serie_diaria"]

        assert serie[0] == {"data": "2026-11-01", "receitas": "5200.00", "despesas": "1450.00", "saldo_acumulado": "3750.00"}
        assert serie[1] == {"data": "2026-11-02", "receitas": "0.00", "despesas": "380.00", "saldo_acumulado": "3370.00"}
        assert serie[2] == {"data": "2026-11-03", "receitas": "0.00", "despesas": "0.00", "saldo_acumulado": "3370.00"}
        assert serie[3]["saldo_acumulado"] == "3346.10"
        assert serie[-1] == {"data": "2026-11-30", "receitas": "0.00", "despesas": "0.00", "saldo_acumulado": "3346.10"}

    def test_mes_sem_transacoes(self, cliente_logado):
        serie = cliente_logado.get(URL, {"mes": "2020-01"}).json()["serie_diaria"]
        assert len(serie) == 31
        assert all(
            (d["receitas"], d["despesas"], d["saldo_acumulado"]) == ("0.00", "0.00", "0.00") for d in serie
        )

    def test_precisao_decimal(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario)
        criar_transacao(mercado, valor="0.10", data=date(2026, 11, 3))
        criar_transacao(mercado, valor="0.20", data=date(2026, 11, 3))
        serie = cliente_logado.get(URL, {"mes": "2026-11"}).json()["serie_diaria"]
        assert serie[2]["despesas"] == "0.30"
        assert serie[2]["saldo_acumulado"] == "-0.30"

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00", data=date(2026, 11, 3))
        serie = cliente_logado.get(URL, {"mes": "2026-11"}).json()["serie_diaria"]
        assert all(d["despesas"] == "0.00" for d in serie)


@pytest.mark.django_db
class TestMesAnterior:
    def test_totais_do_mes_anterior(self, cliente_logado, usuario):
        salario = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        criar_transacao(salario, valor="6420.00", data=date(2026, 10, 1))
        criar_transacao(mercado, valor="4000.50", data=date(2026, 10, 15))
        criar_transacao(mercado, valor="105.10", data=date(2026, 10, 31))
        criar_transacao(mercado, valor="1.00", data=date(2026, 9, 30))  # dois meses antes
        criar_transacao(mercado, valor="2.00", data=date(2026, 11, 1))  # mês atual

        anterior = cliente_logado.get(URL, {"mes": "2026-11"}).json()["mes_anterior"]

        assert anterior == {"mes": "2026-10", "receitas": "6420.00", "despesas": "4105.60", "saldo": "2314.40"}

    def test_virada_de_ano(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario)
        criar_transacao(mercado, valor="300.00", data=date(2025, 12, 31))
        criar_transacao(mercado, valor="7.00", data=date(2026, 1, 2))
        anterior = cliente_logado.get(URL, {"mes": "2026-01"}).json()["mes_anterior"]
        assert anterior == {"mes": "2025-12", "receitas": "0.00", "despesas": "300.00", "saldo": "-300.00"}

    def test_mes_anterior_vazio(self, cliente_logado):
        anterior = cliente_logado.get(URL, {"mes": "2026-11"}).json()["mes_anterior"]
        assert anterior == {"mes": "2026-10", "receitas": "0.00", "despesas": "0.00", "saldo": "0.00"}

    def test_precisao_decimal(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario)
        criar_transacao(mercado, valor="0.10", data=date(2026, 10, 3))
        criar_transacao(mercado, valor="0.20", data=date(2026, 10, 4))
        anterior = cliente_logado.get(URL, {"mes": "2026-11"}).json()["mes_anterior"]
        assert anterior["despesas"] == "0.30"

    def test_isolamento(self, cliente_logado, outro_usuario):
        criar_transacao(criar_categoria(outro_usuario), valor="50.00", data=date(2026, 10, 3))
        anterior = cliente_logado.get(URL, {"mes": "2026-11"}).json()["mes_anterior"]
        assert anterior["despesas"] == "0.00"



@pytest.mark.django_db
def test_quantidade_por_categoria_conta_so_o_mes(cliente_logado, usuario):
    mercado = criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
    criar_transacao(mercado, valor="10.00", data=date(2026, 11, 1))
    criar_transacao(mercado, valor="20.00", data=date(2026, 11, 30))
    criar_transacao(mercado, valor="30.00", data=date(2026, 10, 31))
    itens = cliente_logado.get(URL, {"mes": "2026-11"}).json()["por_categoria"]
    assert [(i["nome"], i["quantidade"], i["total"]) for i in itens] == [("Mercado", 2, "30.00")]
