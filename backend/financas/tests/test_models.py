import pytest
from django.db import IntegrityError, transaction

from financas.models import Categoria
from financas.tests.factories import criar_categoria, criar_usuario


@pytest.mark.django_db
class TestCategoria:
    def test_cor_padrao(self):
        categoria = criar_categoria(criar_usuario())
        assert categoria.cor == "#64748B"

    def test_nome_duplicado_ignorando_maiusculas_no_mesmo_usuario(self):
        usuario = criar_usuario()
        criar_categoria(usuario, nome="Mercado")
        with pytest.raises(IntegrityError), transaction.atomic():
            criar_categoria(usuario, nome="MERCADO")

    def test_mesmo_nome_em_usuarios_diferentes(self):
        criar_categoria(criar_usuario("ana"), nome="Mercado")
        criar_categoria(criar_usuario("bia"), nome="Mercado")
        assert Categoria.objects.filter(nome="Mercado").count() == 2

    def test_str(self):
        categoria = criar_categoria(criar_usuario(), nome="Salário", tipo="RECEITA")
        assert str(categoria) == "Salário (Receita)"
