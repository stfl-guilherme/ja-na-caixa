import re
from datetime import date

from rest_framework.exceptions import ValidationError

_MES_RE = re.compile(r"^(\d{4})-(\d{2})$")


def intervalo_do_mes(mes: str) -> tuple[date, date]:
    """Converte 'AAAA-MM' em (primeiro dia do mês, primeiro dia do mês seguinte)."""
    correspondencia = _MES_RE.match(mes or "")
    if not correspondencia:
        raise ValidationError({"mes": ["Use o formato AAAA-MM."]})
    ano, numero = int(correspondencia.group(1)), int(correspondencia.group(2))
    if not 1 <= numero <= 12 or ano < 1:
        raise ValidationError({"mes": ["Mês inválido."]})
    inicio = date(ano, numero, 1)
    fim = date(ano + 1, 1, 1) if numero == 12 else date(ano, numero + 1, 1)
    return inicio, fim


def mes_anterior(mes: str) -> str:
    """'AAAA-MM' do mês anterior; janeiro volta para dezembro do ano anterior."""
    inicio, _ = intervalo_do_mes(mes)
    ano, numero = (inicio.year - 1, 12) if inicio.month == 1 else (inicio.year, inicio.month - 1)
    return f"{ano:04d}-{numero:02d}"


def filtrar_transacoes(queryset, params):
    mes = params.get("mes")
    if mes:
        inicio, fim = intervalo_do_mes(mes)
        queryset = queryset.filter(data__gte=inicio, data__lt=fim)
    categoria = params.get("categoria")
    if categoria:
        if not categoria.isdigit():
            raise ValidationError({"categoria": ["Informe o id numérico da categoria."]})
        queryset = queryset.filter(categoria_id=int(categoria))
    tipo = params.get("tipo")
    if tipo:
        if tipo not in ("RECEITA", "DESPESA"):
            raise ValidationError({"tipo": ["Use RECEITA ou DESPESA."]})
        queryset = queryset.filter(categoria__tipo=tipo)
    busca = (params.get("busca") or "").strip()
    if busca:
        queryset = queryset.filter(descricao__icontains=busca)
    return queryset
