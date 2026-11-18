import pytest


@pytest.fixture(autouse=True)
def _hasher_rapido(settings):
    """Hash de senha rápido nos testes (o padrão PBKDF2 deixa a suíte lenta)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def usuario(db):
    from financas.tests.factories import criar_usuario

    return criar_usuario("ana")


@pytest.fixture
def outro_usuario(db):
    from financas.tests.factories import criar_usuario

    return criar_usuario("bia")


@pytest.fixture
def cliente_logado(api_client, usuario):
    api_client.force_login(usuario)
    return api_client
