"""Usuários de demonstração (spec, seção 7; ADR-018).

Dois modos, cada um com seu usuário: `exemplo` (dados de 12 meses) e `vazio`.
A cada entrada pela demonstração, os dados do usuário do modo são recriados.
"""

import calendar
import random
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from financas.models import Categoria, Transacao

MODO_PADRAO = "exemplo"
USUARIO_DO_MODO = {"exemplo": "demo", "vazio": "demo-vazio"}

# Cores da paleta fixa do design (--jnc-cat-*, frontend/src/styles/tokens.css).
CATEGORIAS = [
    ("Salário", "RECEITA", "#2F7D35"),
    ("Freelance", "RECEITA", "#C2416A"),
    ("Moradia", "DESPESA", "#2F6FB2"),
    ("Mercado", "DESPESA", "#B5541A"),
    ("Transporte", "DESPESA", "#7B5CC4"),
    ("Restaurantes", "DESPESA", "#A54F98"),
    ("Lazer", "DESPESA", "#8C6A0C"),
    ("Saúde", "DESPESA", "#1F7A70"),
]

# (categoria, descrição, valor mínimo, valor máximo). 20 lançamentos por mês.
MODELOS_DO_MES = [
    ("Salário", "Salário mensal", 4500, 4500),
    ("Freelance", "Projeto freelance", 400, 1200),
    ("Moradia", "Aluguel", 1200, 1200),
    ("Moradia", "Conta de luz", 90, 180),
    ("Moradia", "Internet", 99, 99),
    ("Mercado", "Supermercado", 150, 420),
    ("Mercado", "Supermercado", 120, 380),
    ("Mercado", "Feira", 40, 90),
    ("Mercado", "Padaria", 15, 45),
    ("Transporte", "Combustível", 150, 260),
    ("Transporte", "Aplicativo de transporte", 18, 55),
    ("Transporte", "Ônibus", 25, 50),
    ("Restaurantes", "Almoço", 30, 70),
    ("Restaurantes", "Pizza", 60, 110),
    ("Restaurantes", "Lanche", 20, 45),
    ("Lazer", "Cinema", 30, 80),
    ("Lazer", "Streaming", 39.9, 39.9),
    ("Lazer", "Show", 80, 200),
    ("Saúde", "Farmácia", 25, 120),
    ("Saúde", "Academia", 110, 110),
]


def _meses_recentes(hoje: date, quantidade: int = 12) -> list[tuple[int, int]]:
    meses = []
    ano, mes = hoje.year, hoje.month
    for _ in range(quantidade):
        meses.append((ano, mes))
        ano, mes = (ano - 1, 12) if mes == 1 else (ano, mes - 1)
    return list(reversed(meses))



def usuario_demo(modo: str):
    """Usuário do modo, criado se ainda não existir, com senha inutilizável (ADR-009)."""
    usuario, criado = get_user_model().objects.get_or_create(username=USUARIO_DO_MODO[modo])
    if criado:
        usuario.set_unusable_password()
        usuario.save()
    return usuario


def tem_dados(usuario) -> bool:
    return Categoria.objects.filter(usuario=usuario).exists()


def _popular_exemplo(usuario) -> int:
    categorias = {
        nome: Categoria.objects.create(usuario=usuario, nome=nome, tipo=tipo, cor=cor)
        for nome, tipo, cor in CATEGORIAS
    }
    gerador = random.Random(42)
    hoje = timezone.localdate()
    novas = []
    for ano, mes in _meses_recentes(hoje):
        ultimo_dia = hoje.day if (ano, mes) == (hoje.year, hoje.month) else calendar.monthrange(ano, mes)[1]
        for nome_categoria, descricao, minimo, maximo in MODELOS_DO_MES:
            centavos = gerador.randint(round(minimo * 100), round(maximo * 100))
            novas.append(
                Transacao(
                    categoria=categorias[nome_categoria],
                    descricao=descricao,
                    valor=Decimal(centavos) / 100,
                    data=date(ano, mes, gerador.randint(1, ultimo_dia)),
                )
            )
    Transacao.objects.bulk_create(novas)
    return len(novas)


@transaction.atomic
def recriar_demo(modo: str = MODO_PADRAO):
    """Apaga categorias e transações do usuário do modo e, em `exemplo`, roda o seed de novo."""
    if modo not in USUARIO_DO_MODO:
        raise ValueError(f"Modo de demonstração inválido: {modo!r}")
    usuario = usuario_demo(modo)
    Transacao.objects.filter(categoria__usuario=usuario).delete()
    Categoria.objects.filter(usuario=usuario).delete()
    if modo == "exemplo":
        _popular_exemplo(usuario)
    return usuario
