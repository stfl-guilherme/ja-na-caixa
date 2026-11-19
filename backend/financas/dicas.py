"""Dicas do Papo (spec 17.2; ADR-022).

Regras fixas, sem IA: o mesmo dado sempre gera a mesma dica. Os textos saem
prontos (moeda BRL e mês por extenso), em tom informativo.
"""

from decimal import ROUND_DOWN, Decimal

from financas.filters import intervalo_do_mes, mes_anterior
from financas.models import Categoria, TipoCategoria, Transacao
from financas.orcamentos import orcamentos_do_mes

MAXIMO = 3
CRESCIMENTO_MINIMO_PERCENTUAL = Decimal("20")
CRESCIMENTO_MINIMO_REAIS = Decimal("50")
CONCENTRACAO_MINIMA = Decimal("40")

MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def formatar_brl(valor: Decimal) -> str:
    """Decimal('1234.5') → 'R$ 1.234,50'."""
    texto = f"{valor.quantize(Decimal('0.01')):,.2f}"
    return "R$ " + texto.replace(",", "_").replace(".", ",").replace("_", ".")


def nome_do_mes(mes: str) -> str:
    return MESES[int(mes[5:7]) - 1]


def _inteiro(percentual: Decimal) -> int:
    """Percentual truncado, como na tela (79,99% → 79)."""
    return int(percentual.quantize(Decimal("1"), rounding=ROUND_DOWN))


def _link_categoria(categoria_id: int, mes: str) -> str:
    return f"/transacoes?categoria={categoria_id}&mes={mes}"


def _dica(id_: str, tipo: str, texto: str, link: str | None = None) -> dict:
    return {"id": id_, "tipo": tipo, "texto": texto, "link": link}


def _totais(usuario, mes: str) -> tuple[Decimal, dict[int, tuple[str, Decimal]], int]:
    """(receitas, despesas por categoria {id: (nome, total)}, quantidade de transações) do mês."""
    inicio, fim = intervalo_do_mes(mes)
    receitas = Decimal("0")
    despesas: dict[int, tuple[str, Decimal]] = {}
    quantidade = 0
    for valor, tipo, categoria_id, nome in Transacao.objects.filter(
        categoria__usuario=usuario, data__gte=inicio, data__lt=fim
    ).values_list("valor", "categoria__tipo", "categoria_id", "categoria__nome"):
        quantidade += 1
        if tipo == TipoCategoria.RECEITA:
            receitas += valor
        else:
            _, total = despesas.get(categoria_id, (nome, Decimal("0")))
            despesas[categoria_id] = (nome, total + valor)
    return receitas, despesas, quantidade


def gerar_dicas(usuario, mes: str) -> list[dict]:
    intervalo_do_mes(mes)  # valida o formato antes de qualquer regra
    if not Categoria.objects.filter(usuario=usuario).exists():
        return [_dica("primeira_categoria", "primeiros_passos", "Crie sua primeira categoria para começar.", "/categorias")]

    receitas, despesas_por_categoria, quantidade = _totais(usuario, mes)
    if quantidade == 0:
        return [_dica("primeira_transacao", "primeiros_passos", f"Lance sua primeira transação de {nome_do_mes(mes)}.")]

    anterior = mes_anterior(mes)
    _, despesas_anteriores, _ = _totais(usuario, anterior)
    despesas = sum((total for _, total in despesas_por_categoria.values()), Decimal("0"))
    total_anterior = sum((total for _, total in despesas_anteriores.values()), Decimal("0"))
    orcamentos = orcamentos_do_mes(usuario, mes)
    dicas: list[dict] = []

    # 1. Orçamento estourado: a categoria de maior excesso.
    estourados = [o for o in orcamentos if o["situacao"] == "estourado"]
    if estourados:
        o = max(estourados, key=lambda item: item["excesso"])
        dicas.append(
            _dica(
                "orcamento_estourado",
                "alerta",
                f"{o['categoria'].nome} passou do limite em {formatar_brl(o['excesso'])}.",
                _link_categoria(o["categoria"].pk, mes),
            )
        )

    # 2. Mês no vermelho.
    if despesas > receitas:
        dicas.append(
            _dica(
                "mes_no_vermelho",
                "alerta",
                "O mês está no vermelho até agora: as despesas passaram as receitas em "
                f"{formatar_brl(despesas - receitas)}.",
                f"/transacoes?tipo=DESPESA&mes={mes}",
            )
        )

    # 3. Orçamento perto do limite (80% a 100%): o de maior percentual.
    perto = [o for o in orcamentos if o["situacao"] == "atencao"]
    if perto:
        o = max(perto, key=lambda item: item["percentual"])
        dicas.append(
            _dica(
                "orcamento_perto",
                "info",
                f"{o['categoria'].nome} já usou {_inteiro(o['percentual'])}% do limite de {nome_do_mes(mes)}.",
                _link_categoria(o["categoria"].pk, mes),
            )
        )

    # 4. Categoria que mais cresceu (em R$), com ≥ 20% e ≥ R$ 50,00.
    if total_anterior > 0:
        candidatas = []
        for categoria_id, (nome, total) in despesas_por_categoria.items():
            _, antes = despesas_anteriores.get(categoria_id, (nome, Decimal("0")))
            if antes <= 0:
                continue
            aumento = total - antes
            percentual = aumento * 100 / antes
            if aumento >= CRESCIMENTO_MINIMO_REAIS and percentual >= CRESCIMENTO_MINIMO_PERCENTUAL:
                candidatas.append((aumento, percentual, categoria_id, nome))
        if candidatas:
            aumento, percentual, categoria_id, nome = max(candidatas, key=lambda c: (c[0], -c[2]))
            dicas.append(
                _dica(
                    "categoria_cresceu",
                    "info",
                    f"{nome} subiu {_inteiro(percentual)}% em relação a {nome_do_mes(anterior)} "
                    f"(mais {formatar_brl(aumento)}).",
                    _link_categoria(categoria_id, mes),
                )
            )

    # 5. Concentração: uma categoria com mais de 40% das despesas.
    if despesas > 0:
        categoria_id, (nome, total) = max(despesas_por_categoria.items(), key=lambda item: (item[1][1], -item[0]))
        fatia = total * 100 / despesas
        if fatia > CONCENTRACAO_MINIMA:
            dicas.append(
                _dica(
                    "concentracao",
                    "info",
                    f"{nome} concentra {_inteiro(fatia)}% das despesas de {nome_do_mes(mes)}.",
                    _link_categoria(categoria_id, mes),
                )
            )

    # 6. Despesas caíram em relação ao mês anterior.
    if total_anterior > 0 and despesas < total_anterior:
        dicas.append(
            _dica(
                "despesas_cairam",
                "parabens",
                f"Suas despesas caíram {formatar_brl(total_anterior - despesas)} em relação a "
                f"{nome_do_mes(anterior)}. Boa!",
            )
        )

    return dicas[:MAXIMO]
