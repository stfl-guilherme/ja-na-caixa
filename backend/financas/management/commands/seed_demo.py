"""Prepara um usuário de demonstração (spec, seção 7; ADR-018)."""

from django.core.management.base import BaseCommand, CommandError

from financas.demo import MODO_PADRAO, USUARIO_DO_MODO, recriar_demo, tem_dados, usuario_demo
from financas.models import Categoria, Transacao


class Command(BaseCommand):
    help = "Cria o usuário de demonstração do modo escolhido (exemplo ou vazio)."

    def add_arguments(self, parser):
        parser.add_argument("--modo", default=MODO_PADRAO, help="exemplo (padrão) ou vazio.")
        parser.add_argument(
            "--reset", action="store_true", help="Apaga e recria os dados do usuário do modo."
        )

    def handle(self, *args, **options):
        modo = options["modo"]
        if modo not in USUARIO_DO_MODO:
            raise CommandError('Use --modo "exemplo" ou --modo "vazio".')
        usuario = usuario_demo(modo)
        if tem_dados(usuario) and not options["reset"]:
            self.stdout.write(f"Usuário {usuario.username} já tem dados. Use --reset para recriá-los.")
            return
        usuario = recriar_demo(modo)
        categorias = Categoria.objects.filter(usuario=usuario).count()
        transacoes = Transacao.objects.filter(categoria__usuario=usuario).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Usuário {usuario.username} pronto: {categorias} categorias e {transacoes} transações."
            )
        )
