from datetime import date

import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from financas.models import Categoria, Transacao
from financas.tests.factories import criar_categoria, criar_transacao, criar_usuario


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


@pytest.mark.django_db
class TestTransacao:
    @pytest.mark.parametrize("valor", ["0.00", "-5.00"])
    def test_valor_deve_ser_positivo(self, valor):
        categoria = criar_categoria(criar_usuario())
        with pytest.raises(IntegrityError), transaction.atomic():
            criar_transacao(categoria, valor=valor)

    def test_categoria_com_transacao_nao_pode_ser_excluida(self):
        categoria = criar_categoria(criar_usuario())
        criar_transacao(categoria)
        with pytest.raises(ProtectedError):
            categoria.delete()

    def test_tipo_e_usuario_vem_da_categoria(self):
        usuario = criar_usuario()
        categoria = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        transacao = criar_transacao(categoria, valor="100.00")
        assert transacao.tipo == "RECEITA"
        assert transacao.usuario == usuario

    def test_ordem_padrao_data_e_id_decrescentes(self):
        categoria = criar_categoria(criar_usuario())
        antiga = criar_transacao(categoria, data=date(2026, 11, 1))
        nova1 = criar_transacao(categoria, data=date(2026, 11, 5))
        nova2 = criar_transacao(categoria, data=date(2026, 11, 5))
        assert list(Transacao.objects.all()) == [nova2, nova1, antiga]
