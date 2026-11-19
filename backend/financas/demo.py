"""Usuários de demonstração (spec, seção 7; ADR-018).

Dois modos, cada um com seu usuário: `exemplo` (dados de 12 meses, com limites,
formas de pagamento e fixas, spec 17.5) e `vazio`.
A cada entrada pela demonstração, os dados do usuário do modo são recriados.
"""

import calendar
import random
from datetime import date
from decimal import ROUND_FLOOR, Decimal

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

# (categoria, descrição, valor mínimo, valor máximo, forma de pagamento). Lançamentos avulsos do mês.
MODELOS_DO_MES = [
    ("Freelance", "Projeto freelance", 400, 1200, "PIX"),
    ("Moradia", "Conta de luz", 90, 180, "BOLETO"),
    ("Mercado", "Supermercado", 150, 420, "CARTAO_DEBITO"),
    ("Mercado", "Supermercado", 120, 380, "CARTAO_CREDITO"),
    ("Mercado", "Feira", 40, 90, "DINHEIRO"),
    ("Mercado", "Padaria", 15, 45, "NAO_INFORMADO"),
    ("Transporte", "Combustível", 150, 260, "CARTAO_CREDITO"),
    ("Transporte", "Aplicativo de transporte", 18, 55, "PIX"),
    ("Transporte", "Ônibus", 25, 50, "NAO_INFORMADO"),
    ("Restaurantes", "Almoço", 30, 70, "CARTAO_DEBITO"),
    ("Restaurantes", "Pizza", 60, 110, "PIX"),
    ("Restaurantes", "Lanche", 20, 45, "DINHEIRO"),
    ("Lazer", "Cinema", 30, 80, "CARTAO_CREDITO"),
    ("Lazer", "Show", 80, 200, "PIX"),
    ("Saúde", "Farmácia", 25, 120, "NAO_INFORMADO"),
    ("Saúde", "Academia", 110, 110, "CARTAO_CREDITO"),
]

# Fixas (spec 17.4): (categoria, descrição, valor, dia, forma, já repetida no mês atual?).
# Internet e streaming ficam sem repetir no mês atual, para o botão "Repetir fixas" ter o que mostrar.
FIXAS = [
    ("Salário", "Salário mensal", "4500.00", 5, "TRANSFERENCIA", True),
    ("Moradia", "Aluguel", "1200.00", 10, "BOLETO", True),
    ("Moradia", "Internet", "99.00", 15, "CARTAO_CREDITO", False),
    ("Lazer", "Streaming", "39.90", 20, "CARTAO_CREDITO", False),
]

# Limites calculados sobre o gasto do mês atual (ADR-025): ~60%, ~85% e estourado.
FATOR_DO_LIMITE = {"Mercado": Decimal("0.60"), "Restaurantes": Decimal("0.85"), "Lazer": Decimal("1.15")}


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
    anteriores: dict[str, Transacao] = {}
    for ano, mes in _meses_recentes(hoje):
        atual = (ano, mes) == (hoje.year, hoje.month)
        ultimo_dia = hoje.day if atual else calendar.monthrange(ano, mes)[1]
        for nome_categoria, descricao, valor, dia, forma, repetida_no_atual in FIXAS:
            if atual and not repetida_no_atual:
                continue
            # Cada mês repete o do mês anterior (repetida_de), como o botão "Repetir fixas" faria.
            anteriores[descricao] = Transacao.objects.create(
                categoria=categorias[nome_categoria],
                descricao=descricao,
                valor=Decimal(valor),
                data=date(ano, mes, min(dia, ultimo_dia)),
                forma_pagamento=forma,
                fixa=True,
                repetida_de=anteriores.get(descricao),
            )
        for nome_categoria, descricao, minimo, maximo, forma in MODELOS_DO_MES:
            centavos = gerador.randint(round(minimo * 100), round(maximo * 100))
            novas.append(
                Transacao(
                    categoria=categorias[nome_categoria],
                    descricao=descricao,
                    valor=Decimal(centavos) / 100,
                    data=date(ano, mes, gerador.randint(1, ultimo_dia)),
                    forma_pagamento=forma,
                )
            )
    # Transporte cresce no mês atual, para a dica de "categoria que mais cresceu".
    novas.append(
        Transacao(
            categoria=categorias["Transporte"],
            descricao="Revisão do carro",
            valor=Decimal("320.00"),
            data=hoje,
            forma_pagamento="CARTAO_CREDITO",
        )
    )
    Transacao.objects.bulk_create(novas)
    _definir_limites(categorias, hoje)
    return Transacao.objects.filter(categoria__usuario=usuario).count()


def _definir_limites(categorias: dict[str, Categoria], hoje: date) -> None:
    for nome, fator in FATOR_DO_LIMITE.items():
        categoria = categorias[nome]
        gasto = sum(
            categoria.transacoes.filter(data__year=hoje.year, data__month=hoje.month).values_list("valor", flat=True),
            Decimal("0"),
        )
        # Arredonda para baixo em reais: o percentual fica um pouco acima do alvo, nunca abaixo.
        categoria.limite_mensal = max(Decimal("1"), (gasto / fator).to_integral_value(rounding=ROUND_FLOOR))
        categoria.save(update_fields=["limite_mensal"])


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
