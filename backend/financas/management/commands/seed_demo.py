"""Cria o usuário `demo` com categorias e ~60 transações nos últimos 3 meses."""

import calendar
import random
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from financas.models import Categoria, Transacao

DEMO_USERNAME = "demo"

CATEGORIAS = [
    ("Salário", "RECEITA", "#16A34A"),
    ("Freelance", "RECEITA", "#0EA5E9"),
    ("Moradia", "DESPESA", "#F97316"),
    ("Mercado", "DESPESA", "#22C55E"),
    ("Transporte", "DESPESA", "#3B82F6"),
    ("Restaurantes", "DESPESA", "#EF4444"),
    ("Lazer", "DESPESA", "#A855F7"),
    ("Saúde", "DESPESA", "#EC4899"),
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


def _meses_recentes(hoje: date, quantidade: int = 3) -> list[tuple[int, int]]:
    meses = []
    ano, mes = hoje.year, hoje.month
    for _ in range(quantidade):
        meses.append((ano, mes))
        ano, mes = (ano - 1, 12) if mes == 1 else (ano, mes - 1)
    return list(reversed(meses))


class Command(BaseCommand):
    help = "Cria o usuário de demonstração com dados de exemplo."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset", action="store_true", help="Apaga e recria os dados do usuário demo."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        demo, criado = User.objects.get_or_create(username=DEMO_USERNAME)
        if criado:
            demo.set_unusable_password()  # ADR-009: só entra pelo botão de demonstração.
            demo.save()

        if options["reset"]:
            Transacao.objects.filter(categoria__usuario=demo).delete()
            Categoria.objects.filter(usuario=demo).delete()
        elif Categoria.objects.filter(usuario=demo).exists():
            self.stdout.write("Usuário demo já tem dados. Use --reset para recriá-los.")
            return

        categorias = {
            nome: Categoria.objects.create(usuario=demo, nome=nome, tipo=tipo, cor=cor)
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
        self.stdout.write(
            self.style.SUCCESS(
                f"Usuário demo pronto: {len(categorias)} categorias e {len(novas)} transações."
            )
        )
