from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.core.management import call_command
from django.utils import timezone

from financas.models import Categoria, Transacao
from financas.tests.factories import criar_categoria, criar_transacao, criar_usuario

# Cores de categoria do design (--jnc-cat-* em frontend/src/styles/tokens.css).
PALETA = {
    "#2F6FB2", "#B5541A", "#7B5CC4", "#8C6A0C", "#1F7A70",
    "#C2416A", "#557280", "#2F7D35", "#8A5A2E", "#A54F98",
}


@pytest.mark.django_db
class TestSeedDemo:
    def test_cria_usuario_categorias_e_transacoes(self):
        call_command("seed_demo")
        demo = User.objects.get(username="demo")
        assert not demo.has_usable_password()
        assert Categoria.objects.filter(usuario=demo).count() == 8
        transacoes = Transacao.objects.filter(categoria__usuario=demo)
        assert 230 <= transacoes.count() <= 250
        hoje = timezone.localdate()
        limite = hoje.replace(day=1)
        for _ in range(11):
            limite = (limite - timedelta(days=1)).replace(day=1)
        assert all(limite <= t.data <= hoje for t in transacoes)
        assert transacoes.filter(categoria__tipo="RECEITA").exists()
        assert transacoes.filter(categoria__tipo="DESPESA").exists()

    def test_tem_transacoes_em_cada_um_dos_12_meses(self):
        call_command("seed_demo")
        meses = {(t.year, t.month) for t in Transacao.objects.values_list("data", flat=True)}
        assert len(meses) == 12
        hoje = timezone.localdate()
        anterior = hoje.replace(day=1) - timedelta(days=1)
        assert (anterior.year, anterior.month) in meses

    def test_cores_da_paleta_do_design(self):
        call_command("seed_demo")
        assert set(Categoria.objects.values_list("cor", flat=True)) <= PALETA

    def test_tem_transacoes_no_mes_atual(self):
        call_command("seed_demo")
        hoje = timezone.localdate()
        assert Transacao.objects.filter(data__year=hoje.year, data__month=hoje.month).exists()

    def test_rodar_duas_vezes_nao_duplica(self):
        call_command("seed_demo")
        total = Transacao.objects.count()
        call_command("seed_demo")
        assert User.objects.filter(username="demo").count() == 1
        assert Transacao.objects.count() == total
        assert Categoria.objects.count() == 8

    def test_reset_recria_dados_do_demo(self):
        call_command("seed_demo")
        demo = User.objects.get(username="demo")
        extra = criar_categoria(demo, nome="Extra")
        criar_transacao(extra)
        call_command("seed_demo", "--reset")
        assert not Categoria.objects.filter(nome="Extra").exists()
        assert Categoria.objects.filter(usuario__username="demo").count() == 8

    def test_nao_mexe_em_outros_usuarios(self):
        ana = criar_usuario("ana")
        criar_transacao(criar_categoria(ana))
        call_command("seed_demo", "--reset")
        assert Transacao.objects.filter(categoria__usuario=ana).count() == 1

    def test_demo_consegue_logar_pelo_endpoint(self, api_client):
        call_command("seed_demo")
        assert api_client.post("/api/auth/demo/").status_code == 200
        assert api_client.get("/api/resumo/").status_code == 200
