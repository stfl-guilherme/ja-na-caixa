import pytest
from rest_framework.test import APIClient


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
