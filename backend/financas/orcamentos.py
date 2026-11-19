"""Orçamento do mês por categoria de despesa (spec 17.1; ADR-021)."""

from decimal import ROUND_HALF_UP, Decimal

from financas.filters import intervalo_do_mes
from financas.models import Categoria, TipoCategoria, Transacao

ATENCAO = Decimal("80")
CEM = Decimal("100")


def situacao(percentual: Decimal) -> str:
    """Pelo percentual exato: ok < 80% ≤ atenção ≤ 100% < estourado."""
    if percentual > CEM:
        return "estourado"
    if percentual >= ATENCAO:
        return "atencao"
    return "ok"


def orcamentos_do_mes(usuario, mes: str) -> list[dict]:
    """Categorias de despesa com limite, com gasto, percentual e excesso em Decimal."""
    inicio, fim = intervalo_do_mes(mes)
    categorias = Categoria.objects.filter(
        usuario=usuario, tipo=TipoCategoria.DESPESA, limite_mensal__isnull=False
    ).order_by("nome")
    gastos: dict[int, Decimal] = {}
    for categoria_id, valor in Transacao.objects.filter(
        categoria__in=categorias, data__gte=inicio, data__lt=fim
    ).values_list("categoria_id", "valor"):
        gastos[categoria_id] = gastos.get(categoria_id, Decimal("0")) + valor

    itens = []
    for categoria in categorias:
        gasto = gastos.get(categoria.pk, Decimal("0"))
        percentual = gasto * CEM / categoria.limite_mensal
        itens.append(
            {
                "categoria": categoria,
                "limite": categoria.limite_mensal,
                "gasto": gasto,
                "percentual": percentual,
                "excesso": max(gasto - categoria.limite_mensal, Decimal("0")),
                "situacao": situacao(percentual),
            }
        )
    return itens


def percentual_texto(percentual: Decimal) -> str:
    return str(percentual.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
