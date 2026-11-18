import pytest


@pytest.mark.django_db
def test_projeto_sobe_e_responde(client):
    resposta = client.get("/api/auth/me/")
    assert resposta.status_code < 500
