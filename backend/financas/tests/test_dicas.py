from datetime import date

import pytest

from financas.tests.factories import criar_categoria, criar_transacao

URL = "/api/dicas/"
NOV = date(2026, 11, 10)
OUT = date(2026, 10, 10)


def dicas(cliente, mes="2026-11"):
    resposta = cliente.get(URL, {"mes": mes})
    assert resposta.status_code == 200
    return resposta.json()


def ids(cliente, mes="2026-11"):
    return [d["id"] for d in dicas(cliente, mes)]


def por_id(cliente, id_dica, mes="2026-11"):
    return next((d for d in dicas(cliente, mes) if d["id"] == id_dica), None)


@pytest.fixture
def salario(usuario):
    """Receita alta: evita a regra do mês no vermelho nos testes de outras regras."""
    categoria = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
    criar_transacao(categoria, valor="100000.00", data=NOV)
    criar_transacao(categoria, valor="100000.00", data=OUT)
    return categoria


@pytest.mark.django_db
class TestOrcamentoEstourado:
    def test_acima_de_100_por_cento(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        criar_transacao(lazer, valor="382.50", data=NOV)
        dica = por_id(cliente_logado, "orcamento_estourado")
        assert dica == {
            "id": "orcamento_estourado",
            "tipo": "alerta",
            "texto": "Lazer passou do limite em R$ 82,50.",
            "link": f"/transacoes?categoria={lazer.pk}&mes=2026-11",
        }

    def test_exatamente_100_por_cento_nao_e_estourado(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        criar_transacao(lazer, valor="300.00", data=NOV)
        assert "orcamento_estourado" not in ids(cliente_logado)

    def test_varias_estouradas_mostra_a_de_maior_excesso(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        mercado = criar_categoria(usuario, nome="Mercado", limite_mensal="1000.00")
        criar_transacao(lazer, valor="200.00", data=NOV)  # 200% do limite, excesso R$ 100
        criar_transacao(mercado, valor="1150.00", data=NOV)  # 115%, excesso R$ 150
        assert por_id(cliente_logado, "orcamento_estourado")["texto"] == "Mercado passou do limite em R$ 150,00."

    def test_valor_com_milhar(self, cliente_logado, usuario, salario):
        moradia = criar_categoria(usuario, nome="Moradia", limite_mensal="1000.00")
        criar_transacao(moradia, valor="2234.56", data=NOV)
        assert por_id(cliente_logado, "orcamento_estourado")["texto"] == "Moradia passou do limite em R$ 1.234,56."


@pytest.mark.django_db
class TestMesNoVermelho:
    def test_despesas_maiores_que_receitas(self, cliente_logado, usuario):
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(receita, valor="1000.00", data=NOV)
        criar_transacao(mercado, valor="1250.40", data=NOV)
        assert por_id(cliente_logado, "mes_no_vermelho") == {
            "id": "mes_no_vermelho",
            "tipo": "alerta",
            "texto": "O mês está no vermelho até agora: as despesas passaram as receitas em R$ 250,40.",
            "link": "/transacoes?tipo=DESPESA&mes=2026-11",
        }

    def test_despesas_iguais_as_receitas_nao_e_vermelho(self, cliente_logado, usuario):
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(receita, valor="1000.00", data=NOV)
        criar_transacao(criar_categoria(usuario, nome="Mercado"), valor="1000.00", data=NOV)
        assert "mes_no_vermelho" not in ids(cliente_logado)


@pytest.mark.django_db
class TestOrcamentoPerto:
    @pytest.mark.parametrize(("gasto", "aparece"), [("79.99", False), ("80.00", True), ("100.00", True), ("100.01", False)])
    def test_entre_80_e_100_por_cento(self, cliente_logado, usuario, salario, gasto, aparece):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        criar_transacao(lazer, valor=gasto, data=NOV)
        assert ("orcamento_perto" in ids(cliente_logado)) is aparece

    def test_texto_com_percentual_e_mes(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="300.00")
        criar_transacao(lazer, valor="256.00", data=NOV)  # 85,33%
        assert por_id(cliente_logado, "orcamento_perto") == {
            "id": "orcamento_perto",
            "tipo": "info",
            "texto": "Lazer já usou 85% do limite de novembro.",
            "link": f"/transacoes?categoria={lazer.pk}&mes=2026-11",
        }

    def test_varias_mostra_a_de_maior_percentual(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        mercado = criar_categoria(usuario, nome="Mercado", limite_mensal="100.00")
        criar_transacao(lazer, valor="81.00", data=NOV)
        criar_transacao(mercado, valor="95.00", data=NOV)
        assert por_id(cliente_logado, "orcamento_perto")["texto"].startswith("Mercado já usou 95%")


@pytest.mark.django_db
class TestCategoriaCresceu:
    @pytest.mark.parametrize(
        ("anterior", "atual", "aparece"),
        [
            ("1000.00", "1199.90", False),  # 19,99% (R$ 199,90)
            ("1000.00", "1200.00", True),  # 20% (R$ 200,00)
            ("200.00", "249.99", False),  # 24,99% mas R$ 49,99
            ("200.00", "250.00", True),  # 25% e R$ 50,00
        ],
    )
    def test_limiares(self, cliente_logado, usuario, salario, anterior, atual, aparece):
        lazer = criar_categoria(usuario, nome="Lazer")
        outra = criar_categoria(usuario, nome="Outra")
        criar_transacao(lazer, valor=anterior, data=OUT)
        criar_transacao(lazer, valor=atual, data=NOV)
        # Despesas grandes noutra categoria: evitam a regra de concentração e mantêm o total estável.
        criar_transacao(outra, valor="5000.00", data=OUT)
        criar_transacao(outra, valor="5000.00", data=NOV)
        assert ("categoria_cresceu" in ids(cliente_logado)) is aparece

    def test_texto(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer")
        criar_transacao(lazer, valor="200.00", data=OUT)
        criar_transacao(lazer, valor="282.50", data=NOV)
        assert por_id(cliente_logado, "categoria_cresceu") == {
            "id": "categoria_cresceu",
            "tipo": "info",
            "texto": "Lazer subiu 41% em relação a outubro (mais R$ 82,50).",
            "link": f"/transacoes?categoria={lazer.pk}&mes=2026-11",
        }

    def test_mostra_o_maior_aumento_em_reais(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer")
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(lazer, valor="100.00", data=OUT)
        criar_transacao(lazer, valor="200.00", data=NOV)  # +100%, +R$ 100
        criar_transacao(mercado, valor="1000.00", data=OUT)
        criar_transacao(mercado, valor="1300.00", data=NOV)  # +30%, +R$ 300
        assert por_id(cliente_logado, "categoria_cresceu")["texto"].startswith("Mercado subiu 30%")

    def test_categoria_sem_gasto_no_mes_anterior_nao_conta(self, cliente_logado, usuario, salario):
        lazer = criar_categoria(usuario, nome="Lazer")
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(mercado, valor="500.00", data=OUT)
        criar_transacao(mercado, valor="500.00", data=NOV)
        criar_transacao(lazer, valor="300.00", data=NOV)
        assert "categoria_cresceu" not in ids(cliente_logado)

    def test_ignorada_sem_despesas_no_mes_anterior(self, cliente_logado, usuario, salario):
        criar_transacao(criar_categoria(usuario, nome="Lazer"), valor="300.00", data=NOV)
        assert "categoria_cresceu" not in ids(cliente_logado)

    def test_virada_de_ano(self, cliente_logado, usuario):
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(receita, valor="100000.00", data=date(2027, 1, 5))
        lazer = criar_categoria(usuario, nome="Lazer")
        outra = criar_categoria(usuario, nome="Outra")
        criar_transacao(lazer, valor="100.00", data=date(2026, 12, 20))
        criar_transacao(lazer, valor="200.00", data=date(2027, 1, 10))
        criar_transacao(outra, valor="5000.00", data=date(2026, 12, 20))
        criar_transacao(outra, valor="5000.00", data=date(2027, 1, 10))
        dica = por_id(cliente_logado, "categoria_cresceu", mes="2027-01")
        assert dica["texto"] == "Lazer subiu 100% em relação a dezembro (mais R$ 100,00)."


@pytest.mark.django_db
class TestConcentracao:
    @pytest.mark.parametrize(("valor", "aparece"), [("4000.00", False), ("4001.00", True)])
    def test_mais_de_40_por_cento(self, cliente_logado, usuario, salario, valor, aparece):
        # 4000 de 10000 = 40% (não aparece); 4001 de 10001 = 40,006% (aparece).
        moradia = criar_categoria(usuario, nome="Moradia")
        criar_transacao(moradia, valor=valor, data=NOV)
        for i in range(4):
            criar_transacao(criar_categoria(usuario, nome=f"Cat {i}"), valor="1500.00", data=NOV)
        assert ("concentracao" in ids(cliente_logado)) is aparece

    def test_texto(self, cliente_logado, usuario, salario):
        moradia = criar_categoria(usuario, nome="Moradia")
        criar_transacao(moradia, valor="450.00", data=NOV)
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(mercado, valor="550.00", data=NOV)
        assert por_id(cliente_logado, "concentracao") == {
            "id": "concentracao",
            "tipo": "info",
            "texto": "Mercado concentra 55% das despesas de novembro.",
            "link": f"/transacoes?categoria={mercado.pk}&mes=2026-11",
        }


@pytest.mark.django_db
class TestDespesasCairam:
    def test_total_menor_que_no_mes_anterior(self, cliente_logado, usuario, salario):
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(mercado, valor="1000.00", data=OUT)
        criar_transacao(mercado, valor="750.00", data=NOV)
        assert por_id(cliente_logado, "despesas_cairam") == {
            "id": "despesas_cairam",
            "tipo": "parabens",
            "texto": "Suas despesas caíram R$ 250,00 em relação a outubro. Boa!",
            "link": None,
        }

    def test_total_igual_nao_aparece(self, cliente_logado, usuario, salario):
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(mercado, valor="1000.00", data=OUT)
        criar_transacao(mercado, valor="1000.00", data=NOV)
        assert "despesas_cairam" not in ids(cliente_logado)

    def test_ignorada_sem_despesas_no_mes_anterior(self, cliente_logado, usuario, salario):
        criar_transacao(criar_categoria(usuario, nome="Mercado"), valor="10.00", data=NOV)
        assert "despesas_cairam" not in ids(cliente_logado)

    def test_virada_de_ano(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado")
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(receita, valor="100000.00", data=date(2027, 1, 5))
        criar_transacao(mercado, valor="900.00", data=date(2026, 12, 15))
        criar_transacao(mercado, valor="600.00", data=date(2027, 1, 15))
        dica = por_id(cliente_logado, "despesas_cairam", mes="2027-01")
        assert dica["texto"] == "Suas despesas caíram R$ 300,00 em relação a dezembro. Boa!"


@pytest.mark.django_db
class TestPrimeirosPassos:
    def test_sem_categorias(self, cliente_logado):
        assert dicas(cliente_logado) == [
            {
                "id": "primeira_categoria",
                "tipo": "primeiros_passos",
                "texto": "Crie sua primeira categoria para começar.",
                "link": "/categorias",
            }
        ]

    def test_sem_transacoes_no_mes(self, cliente_logado, usuario):
        mercado = criar_categoria(usuario, nome="Mercado")
        criar_transacao(mercado, valor="1000.00", data=OUT)  # despesas "caíram" para zero: não deve aparecer
        assert dicas(cliente_logado) == [
            {
                "id": "primeira_transacao",
                "tipo": "primeiros_passos",
                "texto": "Lance sua primeira transação de novembro.",
                "link": None,
            }
        ]


@pytest.mark.django_db
class TestConjunto:
    def test_ordem_por_prioridade_e_no_maximo_3(self, cliente_logado, usuario):
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(receita, valor="100.00", data=NOV)
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        mercado = criar_categoria(usuario, nome="Mercado", limite_mensal="1000.00")
        criar_transacao(lazer, valor="50.00", data=OUT)
        criar_transacao(lazer, valor="150.00", data=NOV)  # estourado e cresceu
        criar_transacao(mercado, valor="900.00", data=NOV)  # perto e concentrado
        assert ids(cliente_logado) == ["orcamento_estourado", "mes_no_vermelho", "orcamento_perto"]

    def test_mes_sem_dicas_lista_vazia(self, cliente_logado, usuario, salario):
        for nome in ("Mercado", "Lazer", "Saúde"):
            categoria = criar_categoria(usuario, nome=nome)
            criar_transacao(categoria, valor="100.00", data=OUT)
            criar_transacao(categoria, valor="100.00", data=NOV)
        assert dicas(cliente_logado) == []

    def test_tom_informativo(self, cliente_logado, usuario):
        receita = criar_categoria(usuario, nome="Salário", tipo="RECEITA")
        criar_transacao(receita, valor="100.00", data=NOV)
        lazer = criar_categoria(usuario, nome="Lazer", limite_mensal="100.00")
        criar_transacao(lazer, valor="50.00", data=OUT)
        criar_transacao(lazer, valor="5000.00", data=NOV)
        textos = " ".join(d["texto"].lower() for d in dicas(cliente_logado))
        for palavra in ("demais", "exagerou", "irresponsável", "cuidado"):
            assert palavra not in textos

    def test_isolamento(self, cliente_logado, usuario, outro_usuario):
        criar_transacao(criar_categoria(usuario, nome="Mercado"), valor="10.00", data=NOV)
        alheia = criar_categoria(outro_usuario, nome="Lazer", limite_mensal="10.00")
        criar_transacao(alheia, valor="500.00", data=NOV)
        assert "orcamento_estourado" not in ids(cliente_logado)
        assert por_id(cliente_logado, "mes_no_vermelho")["texto"].endswith("R$ 10,00.")

    def test_mes_invalido(self, cliente_logado):
        resposta = cliente_logado.get(URL, {"mes": "2026-13"})
        assert resposta.status_code == 400
        assert "mes" in resposta.json()


@pytest.mark.django_db
def test_dicas_sem_login_retorna_401(api_client):
    assert api_client.get(URL).status_code == 401
