import pytest


@pytest.fixture(autouse=True)
def _hasher_rapido(settings):
    """Hash de senha rápido nos testes (o padrão PBKDF2 deixa a suíte lenta)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
