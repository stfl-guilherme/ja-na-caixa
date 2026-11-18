import pytest

from financas.models import Categoria
from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/categorias/"


def url_item(pk: int) -> str:
    return f"{URL}{pk}/"


@pytest.mark.django_db
class TestCrudCategorias:
    def test_criar(self, cliente_logado, usuario):
        resposta = cliente_logado.post(
            URL, {"nome": "Mercado", "tipo": "DESPESA", "cor": "#22C55E"}, format="json"
        )
        assert resposta.status_code == 201
        corpo = resposta.json()
        assert corpo["nome"] == "Mercado"
        assert corpo["tipo"] == "DESPESA"
        assert corpo["cor"] == "#22C55E"
        assert Categoria.objects.get(pk=corpo["id"]).usuario == usuario

    def test_criar_usa_cor_padrao(self, cliente_logado):
        resposta = cliente_logado.post(URL, {"nome": "Outros", "tipo": "DESPESA"}, format="json")
        assert resposta.status_code == 201
        assert resposta.json()["cor"] == "#64748B"

    def test_listar_e_filtrar_por_tipo(self, cliente_logado, usuario):
        criar_categoria(usuario, nome="Mercado", tipo="DESPESA")
        criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        assert len(cliente_logado.get(URL).json()) == 2
        receitas = cliente_logado.get(URL, {"tipo": "RECEITA"}).json()
        assert [c["nome"] for c in receitas] == ["Salário"]

    def test_listagem_traz_quantidade_de_transacoes(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        criar_transacao(categoria)
        assert cliente_logado.get(URL).json()[0]["transacoes"] == 1

    def test_detalhar_atualizar_excluir(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        assert cliente_logado.get(url_item(categoria.pk)).status_code == 200
        resposta = cliente_logado.patch(url_item(categoria.pk), {"nome": "Feira"}, format="json")
        assert resposta.status_code == 200
        assert resposta.json()["nome"] == "Feira"
        resposta = cliente_logado.put(
            url_item(categoria.pk), {"nome": "Feira", "tipo": "RECEITA", "cor": "#000000"}, format="json"
        )
        assert resposta.status_code == 200
        assert resposta.json()["tipo"] == "RECEITA"
        assert cliente_logado.delete(url_item(categoria.pk)).status_code == 204
        assert not Categoria.objects.exists()

    def test_nome_duplicado_ignorando_maiusculas(self, cliente_logado, usuario):
        criar_categoria(usuario, nome="Mercado")
        resposta = cliente_logado.post(URL, {"nome": "mercado", "tipo": "DESPESA"}, format="json")
        assert resposta.status_code == 400
        assert "nome" in resposta.json()

    def test_renomear_para_nome_existente(self, cliente_logado, usuario):
        criar_categoria(usuario, nome="Mercado")
        outra = criar_categoria(usuario, nome="Feira")
        resposta = cliente_logado.patch(url_item(outra.pk), {"nome": "MERCADO"}, format="json")
        assert resposta.status_code == 400

    def test_manter_o_proprio_nome_ao_editar(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, nome="Mercado")
        resposta = cliente_logado.patch(url_item(categoria.pk), {"nome": "MERCADO"}, format="json")
        assert resposta.status_code == 200

    def test_mesmo_nome_em_outro_usuario(self, cliente_logado, outro_usuario):
        criar_categoria(outro_usuario, nome="Mercado")
        resposta = cliente_logado.post(URL, {"nome": "Mercado", "tipo": "DESPESA"}, format="json")
        assert resposta.status_code == 201

    @pytest.mark.parametrize("cor", ["verde", "#12345", "#GGGGGG", "22C55E"])
    def test_cor_invalida(self, cliente_logado, cor):
        resposta = cliente_logado.post(URL, {"nome": "X", "tipo": "DESPESA", "cor": cor}, format="json")
        assert resposta.status_code == 400
        assert "cor" in resposta.json()

    def test_tipo_invalido(self, cliente_logado):
        resposta = cliente_logado.post(URL, {"nome": "X", "tipo": "OUTRO"}, format="json")
        assert resposta.status_code == 400

    def test_excluir_com_transacoes_retorna_409(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario)
        criar_transacao(categoria)
        criar_transacao(categoria)
        resposta = cliente_logado.delete(url_item(categoria.pk))
        assert resposta.status_code == 409
        assert resposta.json()["transacoes"] == 2
        assert "detail" in resposta.json()
        assert Categoria.objects.filter(pk=categoria.pk).exists()

    def test_mudar_tipo_com_transacoes_retorna_400(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, tipo="DESPESA")
        criar_transacao(categoria)
        resposta = cliente_logado.patch(url_item(categoria.pk), {"tipo": "RECEITA"}, format="json")
        assert resposta.status_code == 400
        assert "tipo" in resposta.json()
        categoria.refresh_from_db()
        assert categoria.tipo == "DESPESA"

    def test_manter_tipo_com_transacoes_e_permitido(self, cliente_logado, usuario):
        categoria = criar_categoria(usuario, tipo="DESPESA")
        criar_transacao(categoria)
        resposta = cliente_logado.patch(
            url_item(categoria.pk), {"tipo": "DESPESA", "nome": "Feira"}, format="json"
        )
        assert resposta.status_code == 200


@pytest.mark.django_db
class TestIsolamentoCategorias:
    def test_outro_usuario_recebe_404(self, cliente_logado, outro_usuario):
        alheia = criar_categoria(outro_usuario)
        assert cliente_logado.get(url_item(alheia.pk)).status_code == 404
        assert cliente_logado.patch(url_item(alheia.pk), {"nome": "X"}, format="json").status_code == 404
        assert cliente_logado.delete(url_item(alheia.pk)).status_code == 404
        assert Categoria.objects.filter(pk=alheia.pk, nome="Mercado").exists()

    def test_listagem_nao_mostra_dados_de_outro_usuario(self, cliente_logado, outro_usuario):
        criar_categoria(outro_usuario)
        assert cliente_logado.get(URL).json() == []


@pytest.mark.django_db
def test_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
    assert api_client.post(URL, {}, format="json").status_code == 401
    assert api_client.get(url_item(1)).status_code == 401
