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
