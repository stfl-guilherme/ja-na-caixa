from datetime import date

import pytest

from financas.tests.factories import criar_categoria, criar_transacao

URL_CATEGORIAS = "/api/categorias/"


@pytest.mark.django_db
class TestLimiteMensal:
    def test_cria_despesa_com_limite(self, cliente_logado):
        resposta = cliente_logado.post(
            URL_CATEGORIAS, {"nome": "Lazer", "tipo": "DESPESA", "limite_mensal": "300.00"}, format="json"
        )
        assert resposta.status_code == 201
        assert resposta.json()["limite_mensal"] == "300.00"

    def test_sem_limite_fica_nulo(self, cliente_logado):
        resposta = cliente_logado.post(URL_CATEGORIAS, {"nome": "Lazer", "tipo": "DESPESA"}, format="json")
        assert resposta.status_code == 201
        assert resposta.json()["limite_mensal"] is None

    def test_receita_com_limite_e_rejeitada(self, cliente_logado):
        resposta = cliente_logado.post(
            URL_CATEGORIAS, {"nome": "Salário", "tipo": "RECEITA", "limite_mensal": "100.00"}, format="json"
        )
        assert resposta.status_code == 400
        assert "limite_mensal" in resposta.json()

    @pytest.mark.parametrize("valor", ["0", "0.00", "-10.00"])
    def test_limite_menor_ou_igual_a_zero_e_rejeitado(self, cliente_logado, valor):
        resposta = cliente_logado.post(
            URL_CATEGORIAS, {"nome": "Lazer", "tipo": "DESPESA", "limite_mensal": valor}, format="json"
        )
        assert resposta.status_code == 400
        assert "limite_mensal" in resposta.json()

    def test_trocar_para_receita_mantendo_limite_e_rejeitado(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Extra", limite_mensal="200.00")
        resposta = cliente_logado.patch(f"{URL_CATEGORIAS}{categoria.pk}/", {"tipo": "RECEITA"}, format="json")
        assert resposta.status_code == 400
        assert "Remova o limite" in resposta.json()["limite_mensal"][0]
        categoria.refresh_from_db()
        assert categoria.tipo == "DESPESA"

    def test_trocar_para_receita_enviando_limite_e_rejeitado(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Extra", limite_mensal="200.00")
        resposta = cliente_logado.put(
            f"{URL_CATEGORIAS}{categoria.pk}/",
            {"nome": "Extra", "tipo": "RECEITA", "cor": "#2F6FB2", "limite_mensal": "200.00"},
            format="json",
        )
        assert resposta.status_code == 400
        assert "limite_mensal" in resposta.json()

    def test_trocar_para_receita_removendo_limite_no_mesmo_request(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Extra", limite_mensal="200.00")
        resposta = cliente_logado.put(
            f"{URL_CATEGORIAS}{categoria.pk}/",
            {"nome": "Extra", "tipo": "RECEITA", "cor": "#2F6FB2", "limite_mensal": None},
            format="json",
        )
        assert resposta.status_code == 200
        categoria.refresh_from_db()
        assert categoria.tipo == "RECEITA"
        assert categoria.limite_mensal is None

    def test_patch_sem_limite_mantem_o_limite(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        resposta = cliente_logado.patch(f"{URL_CATEGORIAS}{categoria.pk}/", {"nome": "Diversão"}, format="json")
        assert resposta.status_code == 200
        assert resposta.json()["limite_mensal"] == "300.00"

    def test_remover_limite(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        resposta = cliente_logado.patch(
            f"{URL_CATEGORIAS}{categoria.pk}/", {"limite_mensal": None}, format="json"
        )
        assert resposta.status_code == 200
        assert resposta.json()["limite_mensal"] is None

    def test_limite_com_transacoes_pode_mudar(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Lazer")
        criar_transacao(categoria)
        resposta = cliente_logado.patch(
            f"{URL_CATEGORIAS}{categoria.pk}/", {"limite_mensal": "150.00"}, format="json"
        )
        assert resposta.status_code == 200
        assert resposta.json()["limite_mensal"] == "150.00"


URL = "/api/orcamentos/"


@pytest.mark.django_db
class TestOrcamentos:
    def test_lista_categorias_de_despesa_com_limite(self, cliente_logado, usuario):
        lazer = criar_categoria(usuario, nome="Lazer", cor="#8C6A0C", limite_mensal="300.00")
        mercado = criar_categoria(usuario, nome="Mercado", limite_mensal="500.00")
        criar_categoria(usuario, nome="Saúde")  # sem limite: fora da lista
        criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(lazer, valor="200.00", data=date(2026, 11, 3))
        criar_transacao(lazer, valor="182.50", data=date(2026, 11, 20))
        criar_transacao(lazer, valor="999.00", data=date(2026, 10, 31))  # fora do mês
        criar_transacao(mercado, valor="340.00", data=date(2026, 11, 5))

        corpo = cliente_logado.get(URL, {"mes": "2026-11"}).json()

        assert corpo == [
            {
                "categoria_id": lazer.pk,
                "nome": "Lazer",
                "cor": "#8C6A0C",
                "limite": "300.00",
                "gasto": "382.50",
                "percentual": "127.50",
                "excesso": "82.50",
                "situacao": "estourado",
            },
            {
                "categoria_id": mercado.pk,
                "nome": "Mercado",
                "cor": "#64748B",
                "limite": "500.00",
                "gasto": "340.00",
                "percentual": "68.00",
                "excesso": "0.00",
                "situacao": "ok",
            },
        ]

    @pytest.mark.parametrize(
        ("gasto", "percentual", "situacao"),
        [
            ("7999.00", "79.99", "ok"),
            ("8000.00", "80.00", "atencao"),
            ("10000.00", "100.00", "atencao"),
            ("10001.00", "100.01", "estourado"),
        ],
    )
    def test_limites_exatos_da_situacao(self, cliente_logado, usuario, gasto, percentual, situacao):
        categoria = criar_categoria(usuario, nome="Moradia", limite_mensal="10000.00")
        criar_transacao(categoria, valor=gasto, data=date(2026, 11, 10))
        item = cliente_logado.get(URL, {"mes": "2026-11"}).json()[0]
        assert item["percentual"] == percentual
        assert item["situacao"] == situacao

    def test_situacao_usa_percentual_exato(self, cliente_logado, usuario):
        # 79,995% arredonda para "80.00" na exibição, mas ainda está abaixo de 80%.
        categoria = criar_categoria(usuario, nome="Moradia", limite_mensal="200000.00")
        criar_transacao(categoria, valor="159990.00", data=date(2026, 11, 10))
        item = cliente_logado.get(URL, {"mes": "2026-11"}).json()[0]
        assert item["percentual"] == "80.00"
        assert item["situacao"] == "ok"

    def test_mes_sem_gastos(self, cliente_logado, usuario):
        criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        item = cliente_logado.get(URL, {"mes": "2026-11"}).json()[0]
        assert item["gasto"] == "0.00"
        assert item["percentual"] == "0.00"
        assert item["excesso"] == "0.00"
        assert item["situacao"] == "ok"

    def test_sem_limites_lista_vazia(self, cliente_logado, usuario):
        criar_categoria(usuario, nome="Lazer")
        assert cliente_logado.get(URL, {"mes": "2026-11"}).json() == []

    def test_precisao_decimal(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Lazer", limite_mensal="0.30")
        criar_transacao(categoria, valor="0.10", data=date(2026, 11, 1))
        criar_transacao(categoria, valor="0.20", data=date(2026, 11, 2))
        item = cliente_logado.get(URL, {"mes": "2026-11"}).json()[0]
        assert item["gasto"] == "0.30"
        assert item["percentual"] == "100.00"
        assert item["situacao"] == "atencao"

    def test_isolamento(self, cliente_logado, outro_usuario):
        alheia = criar_categoria(outro_usuario, nome="Lazer", limite_mensal="100.00")
        criar_transacao(alheia, valor="50.00", data=date(2026, 11, 10))
        assert cliente_logado.get(URL, {"mes": "2026-11"}).json() == []

    def test_mes_invalido(self, cliente_logado):
        resposta = cliente_logado.get(URL, {"mes": "2026-13"})
        assert resposta.status_code == 400
        assert "mes" in resposta.json()

    def test_sem_mes_usa_mes_atual(self, cliente_logado, usuario):
        from django.utils import timezone

        categoria = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        criar_transacao(categoria, valor="10.00", data=timezone.localdate())
        assert cliente_logado.get(URL).json()[0]["gasto"] == "10.00"


@pytest.mark.django_db
def test_orcamentos_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
