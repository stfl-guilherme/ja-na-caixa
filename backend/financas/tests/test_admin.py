import pytest
from django.contrib.auth.models import User


@pytest.mark.django_db
@pytest.mark.parametrize("modelo", ["categoria", "transacao"])
def test_modelos_no_admin(client, modelo):
    admin = User.objects.create_superuser("admin", "admin@example.com", "senha-forte-123")
    client.force_login(admin)
    assert client.get(f"/admin/financas/{modelo}/").status_code == 200
