from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from financas.models import Categoria, Transacao


@pytest.mark.django_db
class TestAutenticacao:
    def test_csrf_define_cookie(self, api_client):
        resposta = api_client.get("/api/auth/csrf/")
        assert resposta.status_code == 204
        assert "csrftoken" in resposta.cookies

    def test_login_valido(self, api_client, usuario):
        resposta = api_client.post(
            "/api/auth/login/", {"username": "ana", "password": "senha-forte-123"}, format="json"
        )
        assert resposta.status_code == 200
        assert resposta.json() == {"id": usuario.id, "username": "ana"}
        assert api_client.get("/api/auth/me/").status_code == 200

    def test_login_invalido(self, api_client, usuario):
        resposta = api_client.post(
            "/api/auth/login/", {"username": "ana", "password": "errada"}, format="json"
        )
        assert resposta.status_code == 400
        assert resposta.json() == {"detail": "Usuário ou senha inválidos."}

    def test_login_sem_campos(self, api_client):
        resposta = api_client.post("/api/auth/login/", {}, format="json")
        assert resposta.status_code == 400

    def test_login_exige_csrf(self, usuario):
        cliente = APIClient(enforce_csrf_checks=True)
        resposta = cliente.post(
            "/api/auth/login/", {"username": "ana", "password": "senha-forte-123"}, format="json"
        )
        assert resposta.status_code == 403

    def test_login_com_csrf(self, usuario):
        cliente = APIClient(enforce_csrf_checks=True)
        token = cliente.get("/api/auth/csrf/").cookies["csrftoken"].value
        resposta = cliente.post(
            "/api/auth/login/",
            {"username": "ana", "password": "senha-forte-123"},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        assert resposta.status_code == 200

    def test_me_sem_login_retorna_401(self, api_client):
        assert api_client.get("/api/auth/me/").status_code == 401

    def test_me_logado(self, cliente_logado, usuario):
        resposta = cliente_logado.get("/api/auth/me/")
        assert resposta.status_code == 200
        assert resposta.json() == {"id": usuario.id, "username": "ana"}

    def test_logout(self, cliente_logado):
        assert cliente_logado.post("/api/auth/logout/").status_code == 204
        assert cliente_logado.get("/api/auth/me/").status_code == 401

    def test_logout_sem_login_retorna_401(self, api_client):
        assert api_client.post("/api/auth/logout/").status_code == 401


URL_DEMO = "/api/auth/demo/"


def _entrar(cliente, **corpo):
    return cliente.post(URL_DEMO, corpo, format="json") if corpo else cliente.post(URL_DEMO)


@pytest.mark.django_db
class TestLoginDemo:
    def test_sem_modo_usa_exemplo(self, api_client):
        resposta = _entrar(api_client)
        assert resposta.status_code == 200
        assert resposta.json()["username"] == "demo"
        assert api_client.get("/api/auth/me/").json()["username"] == "demo"
        assert Categoria.objects.filter(usuario__username="demo").count() == 8

    def test_modo_exemplo_recria_o_seed(self, api_client):
        _entrar(api_client, modo="exemplo")
        demo = User.objects.get(username="demo")
        extra = Categoria.objects.create(usuario=demo, nome="Lançada na demo", tipo="DESPESA")
        Transacao.objects.create(categoria=extra, descricao="Teste", valor=Decimal("1.00"), data=date(2026, 11, 1))
        total = Transacao.objects.filter(categoria__usuario=demo).count()

        assert _entrar(APIClient(), modo="exemplo").status_code == 200

        assert not Categoria.objects.filter(nome="Lançada na demo").exists()
        assert Categoria.objects.filter(usuario=demo).count() == 8
        assert Transacao.objects.filter(categoria__usuario=demo).count() == total - 1

    def test_modo_vazio_autentica_em_demo_vazio_sem_dados(self, api_client):
        resposta = _entrar(api_client, modo="vazio")
        assert resposta.status_code == 200
        assert resposta.json()["username"] == "demo-vazio"
        assert api_client.get("/api/categorias/").json() == []
        assert api_client.get("/api/transacoes/").json()["count"] == 0

    def test_logar_de_novo_no_vazio_apaga_o_que_foi_criado(self, api_client):
        _entrar(api_client, modo="vazio")
        categoria = api_client.post("/api/categorias/", {"nome": "Mercado", "tipo": "DESPESA"}, format="json").json()
        api_client.post(
            "/api/transacoes/",
            {"categoria": categoria["id"], "descricao": "Feira", "valor": "20.00", "data": "2026-11-18"},
            format="json",
        )
        api_client.post("/api/auth/logout/")

        _entrar(api_client, modo="vazio")

        assert api_client.get("/api/categorias/").json() == []
        assert api_client.get("/api/transacoes/").json()["count"] == 0

    def test_demo_e_demo_vazio_nao_veem_dados_um_do_outro(self, api_client):
        _entrar(api_client, modo="exemplo")
        id_do_demo = api_client.get("/api/categorias/").json()[0]["id"]
        vazio = APIClient()
        _entrar(vazio, modo="vazio")
        propria = vazio.post("/api/categorias/", {"nome": "Só minha", "tipo": "RECEITA"}, format="json").json()

        assert vazio.get(f"/api/categorias/{id_do_demo}/").status_code == 404
        assert vazio.get("/api/resumo/").json()["receitas"] == "0.00"
        assert api_client.get(f"/api/categorias/{propria['id']}/").status_code == 404
        assert "Só minha" not in [c["nome"] for c in api_client.get("/api/categorias/").json()]

    @pytest.mark.parametrize("modo", ["cheio", "", "VAZIO", 1])
    def test_modo_invalido_retorna_400(self, api_client, modo):
        resposta = _entrar(api_client, modo=modo)
        assert resposta.status_code == 400
        assert "modo" in resposta.json()
        assert api_client.get("/api/auth/me/").status_code == 401

    @pytest.mark.parametrize("corpo", [{}, {"modo": "vazio"}, {"modo": "invalido"}])
    def test_demo_desligado_retorna_404(self, api_client, settings, corpo):
        settings.DEMO_ENABLED = False
        assert _entrar(api_client, **corpo).status_code == 404
        assert api_client.get("/api/auth/me/").status_code == 401
        assert not User.objects.filter(username__startswith="demo").exists()

    @pytest.mark.parametrize("modo", ["exemplo", "vazio"])
    def test_demo_nao_entra_pelo_formulario(self, api_client, modo):
        username = _entrar(APIClient(), modo=modo).json()["username"]
        resposta = api_client.post("/api/auth/login/", {"username": username, "password": ""}, format="json")
        assert resposta.status_code == 400
