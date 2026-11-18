from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User

from financas.models import Categoria


def criar_usuario(username: str = "ana", password: str = "senha-forte-123") -> User:
    return User.objects.create_user(username=username, password=password)


def criar_categoria(usuario: User, nome: str = "Mercado", tipo: str = "DESPESA", **extra) -> Categoria:
    return Categoria.objects.create(usuario=usuario, nome=nome, tipo=tipo, **extra)


def criar_transacao(
    categoria: Categoria,
    valor: str = "10.00",
    data: date | None = None,
    descricao: str = "Compra",
    **extra,
):
    from financas.models import Transacao

    return Transacao.objects.create(
        categoria=categoria,
        valor=Decimal(valor),
        data=data or date(2026, 11, 10),
        descricao=descricao,
        **extra,
    )
