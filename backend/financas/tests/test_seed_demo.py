from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.core.management import CommandError, call_command
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


@pytest.mark.django_db
class TestSeedDemoModos:
    def test_modo_vazio_cria_demo_vazio_sem_dados(self):
        call_command("seed_demo", "--modo", "vazio")
        vazio = User.objects.get(username="demo-vazio")
        assert not vazio.has_usable_password()
        assert not Categoria.objects.filter(usuario=vazio).exists()
        assert not User.objects.filter(username="demo").exists()

    def test_modo_vazio_com_reset_apaga_o_que_foi_lancado(self):
        call_command("seed_demo", "--modo", "vazio")
        vazio = User.objects.get(username="demo-vazio")
        criar_transacao(criar_categoria(vazio, nome="Lançada"))
        call_command("seed_demo", "--modo", "vazio", "--reset")
        assert not Categoria.objects.filter(usuario=vazio).exists()
        assert not Transacao.objects.filter(categoria__usuario=vazio).exists()

    def test_modo_exemplo_e_o_padrao(self):
        call_command("seed_demo", "--modo", "exemplo")
        assert Categoria.objects.filter(usuario__username="demo").count() == 8

    def test_modo_invalido(self):
        with pytest.raises(CommandError):
            call_command("seed_demo", "--modo", "cheio")


def _mes_atual():
    return timezone.localdate().strftime("%Y-%m")


@pytest.mark.django_db
class TestSeedNovasFuncionalidades:
    """Spec 17.5: o modo exemplo demonstra orçamento, dicas, formas e fixas no mês atual."""

    def test_tres_limites_um_em_cada_situacao(self):
        from financas.orcamentos import orcamentos_do_mes

        call_command("seed_demo")
        demo = User.objects.get(username="demo")
        assert Categoria.objects.filter(usuario=demo, limite_mensal__isnull=False).count() == 3
        situacoes = {o["categoria"].nome: o["situacao"] for o in orcamentos_do_mes(demo, _mes_atual())}
        assert situacoes == {"Mercado": "ok", "Restaurantes": "atencao", "Lazer": "estourado"}
        percentuais = {o["categoria"].nome: o["percentual"] for o in orcamentos_do_mes(demo, _mes_atual())}
        assert 55 <= percentuais["Mercado"] <= 65
        assert 80 <= percentuais["Restaurantes"] <= 90

    def test_transporte_cresce_em_relacao_ao_mes_anterior(self):
        from decimal import Decimal

        from financas.filters import intervalo_do_mes, mes_anterior

        call_command("seed_demo")

        def gasto(mes):
            inicio, fim = intervalo_do_mes(mes)
            valores = Transacao.objects.filter(
                categoria__usuario__username="demo", categoria__nome="Transporte", data__gte=inicio, data__lt=fim
            ).values_list("valor", flat=True)
            return sum(valores, Decimal("0"))

        atual, anterior = gasto(_mes_atual()), gasto(mes_anterior(_mes_atual()))
        assert atual - anterior >= Decimal("50")
        assert (atual - anterior) * 100 / anterior >= 20

    def test_formas_de_pagamento_variadas(self):
        call_command("seed_demo")
        formas = set(Transacao.objects.values_list("forma_pagamento", flat=True))
        assert len(formas) >= 5
        assert "NAO_INFORMADO" in formas

    def test_fixas_encadeadas_e_duas_sem_repetir_no_mes_atual(self):
        call_command("seed_demo")
        hoje = timezone.localdate()
        fixas = Transacao.objects.filter(categoria__usuario__username="demo", fixa=True)
        assert set(fixas.values_list("descricao", flat=True)) == {"Salário mensal", "Aluguel", "Internet", "Streaming"}
        do_mes = fixas.filter(data__year=hoje.year, data__month=hoje.month)
        assert set(do_mes.values_list("descricao", flat=True)) == {"Salário mensal", "Aluguel"}
        for copia in do_mes:
            assert copia.repetida_de is not None
            assert copia.repetida_de.descricao == copia.descricao
            assert copia.repetida_de.data < hoje.replace(day=1)

    def test_gera_dicas_e_fixas_para_repetir_no_mes_atual(self, api_client):
        assert api_client.post("/api/auth/demo/", {"modo": "exemplo"}, format="json").status_code == 200
        dicas = api_client.get("/api/dicas/", {"mes": _mes_atual()}).json()
        assert len(dicas) >= 2
        fixas = api_client.get("/api/transacoes/fixas-para-repetir/", {"mes": _mes_atual()}).json()
        assert {t["descricao"] for t in fixas} >= {"Internet", "Streaming"}
        assert len(fixas) >= 2

    def test_modo_vazio_continua_vazio(self, api_client):
        assert api_client.post("/api/auth/demo/", {"modo": "vazio"}, format="json").status_code == 200
        assert api_client.get("/api/transacoes/fixas-para-repetir/", {"mes": _mes_atual()}).json() == []
        assert [d["id"] for d in api_client.get("/api/dicas/").json()] == ["primeira_categoria"]
