import re
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from financas.dicas import gerar_dicas
from financas.filters import filtrar_transacoes, intervalo_do_mes, mes_anterior
from financas.models import Categoria, TipoCategoria, Transacao
from financas.orcamentos import orcamentos_do_mes, percentual_texto
from financas.serializers import CategoriaSerializer, TransacaoSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        # Objetos de outro usuário ficam fora do queryset → 404 (spec 6.5).
        queryset = Categoria.objects.filter(usuario=self.request.user).annotate(
            num_transacoes=Count("transacoes")
        )
        tipo = self.request.query_params.get("tipo")
        if tipo and self.action == "list":
            if tipo not in TipoCategoria.values:
                raise ValidationError({"tipo": ["Use RECEITA ou DESPESA."]})
            queryset = queryset.filter(tipo=tipo)
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def destroy(self, request, *args, **kwargs):
        categoria = self.get_object()
        try:
            categoria.delete()
        except ProtectedError:
            quantidade = categoria.transacoes.count()
            return Response(
                {
                    "detail": "Esta categoria tem transações e não pode ser excluída.",
                    "transacoes": quantidade,
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransacaoPagination(PageNumberPagination):
    """Paginação com os totais do filtro inteiro (spec 6.3), calculados no backend."""

    page_size = 20

    def paginate_queryset(self, queryset, request, view=None):
        self.filtrado = queryset
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        resposta = super().get_paginated_response(data)
        datas_da_pagina = sorted({t.data for t in self.page.object_list}, reverse=True)
        saldo_por_dia = {d: Decimal("0") for d in datas_da_pagina}
        for valor, tipo, dia in self.filtrado.filter(data__in=datas_da_pagina).values_list(
            "valor", "categoria__tipo", "data"
        ):
            saldo_por_dia[dia] += valor if tipo == TipoCategoria.RECEITA else -valor
        resposta.data["totais"] = _totais(*_somar_por_tipo(self.filtrado))
        resposta.data["totais_por_dia"] = [
            {"data": d.isoformat(), "saldo": _dinheiro(saldo_por_dia[d])} for d in datas_da_pagina
        ]
        return resposta


class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    pagination_class = TransacaoPagination

    def get_queryset(self):
        queryset = Transacao.objects.filter(categoria__usuario=self.request.user).select_related(
            "categoria"
        )
        if self.action == "list":
            queryset = filtrar_transacoes(queryset, self.request.query_params)
        return queryset


def _dinheiro(valor: Decimal) -> str:
    return str(valor.quantize(Decimal("0.01")))


def _mes_da_requisicao(request) -> str:
    return request.query_params.get("mes") or timezone.localdate().strftime("%Y-%m")


class ResumoView(APIView):
    """Totais do mês. Somas em Decimal no Python: o front não soma dinheiro (ADR-005)."""

    def get(self, request):
        mes = _mes_da_requisicao(request)
        inicio, fim = intervalo_do_mes(mes)
        transacoes = Transacao.objects.filter(
            categoria__usuario=request.user, data__gte=inicio, data__lt=fim
        ).select_related("categoria")

        totais = {TipoCategoria.RECEITA: Decimal("0"), TipoCategoria.DESPESA: Decimal("0")}
        por_categoria: dict[int, dict] = {}
        for transacao in transacoes:
            categoria = transacao.categoria
            totais[categoria.tipo] += transacao.valor
            item = por_categoria.setdefault(
                categoria.pk,
                {
                    "categoria_id": categoria.pk,
                    "nome": categoria.nome,
                    "cor": categoria.cor,
                    "tipo": categoria.tipo,
                    "total": Decimal("0"),
                    "quantidade": 0,
                },
            )
            item["total"] += transacao.valor
            item["quantidade"] += 1

        itens = sorted(por_categoria.values(), key=lambda i: (-i["total"], i["nome"]))
        receitas = totais[TipoCategoria.RECEITA]
        despesas = totais[TipoCategoria.DESPESA]
        return Response(
            {
                "mes": mes,
                "receitas": _dinheiro(receitas),
                "despesas": _dinheiro(despesas),
                "saldo": _dinheiro(receitas - despesas),
                "por_categoria": [{**i, "total": _dinheiro(i["total"])} for i in itens],
                "mes_anterior": _totais_do_mes(request.user, mes_anterior(mes)),
                "serie_diaria": _serie_diaria(transacoes, inicio, fim),
            }
        )


def _somar_por_tipo(transacoes) -> tuple[Decimal, Decimal]:
    """(receitas, despesas) somadas em Decimal no Python (ADR-005)."""
    receitas = despesas = Decimal("0")
    for valor, tipo in transacoes.values_list("valor", "categoria__tipo"):
        if tipo == TipoCategoria.RECEITA:
            receitas += valor
        else:
            despesas += valor
    return receitas, despesas


def _totais(receitas: Decimal, despesas: Decimal) -> dict:
    return {
        "receitas": _dinheiro(receitas),
        "despesas": _dinheiro(despesas),
        "saldo": _dinheiro(receitas - despesas),
    }


def _totais_do_mes(usuario, mes: str) -> dict:
    inicio, fim = intervalo_do_mes(mes)
    transacoes = Transacao.objects.filter(categoria__usuario=usuario, data__gte=inicio, data__lt=fim)
    return {"mes": mes, **_totais(*_somar_por_tipo(transacoes))}


def _serie_diaria(transacoes, inicio, fim) -> list[dict]:
    """Um item por dia do mês, com o saldo acumulado só dentro do mês (spec 6.4)."""
    por_dia: dict = {}
    for transacao in transacoes:
        dia = por_dia.setdefault(transacao.data, {TipoCategoria.RECEITA: Decimal("0"), TipoCategoria.DESPESA: Decimal("0")})
        dia[transacao.categoria.tipo] += transacao.valor

    serie = []
    acumulado = Decimal("0")
    data = inicio
    while data < fim:
        dia = por_dia.get(data, {TipoCategoria.RECEITA: Decimal("0"), TipoCategoria.DESPESA: Decimal("0")})
        receitas, despesas = dia[TipoCategoria.RECEITA], dia[TipoCategoria.DESPESA]
        acumulado += receitas - despesas
        serie.append(
            {
                "data": data.isoformat(),
                "receitas": _dinheiro(receitas),
                "despesas": _dinheiro(despesas),
                "saldo_acumulado": _dinheiro(acumulado),
            }
        )
        data += timedelta(days=1)
    return serie


class OrcamentosView(APIView):
    """Limite, gasto e situação de cada categoria de despesa com limite (spec 17.1)."""

    def get(self, request):
        mes = _mes_da_requisicao(request)
        return Response(
            [
                {
                    "categoria_id": item["categoria"].pk,
                    "nome": item["categoria"].nome,
                    "cor": item["categoria"].cor,
                    "limite": _dinheiro(item["limite"]),
                    "gasto": _dinheiro(item["gasto"]),
                    "percentual": percentual_texto(item["percentual"]),
                    "excesso": _dinheiro(item["excesso"]),
                    "situacao": item["situacao"],
                }
                for item in orcamentos_do_mes(request.user, mes)
            ]
        )


class DicasView(APIView):
    """Dicas do Papo do mês, no máximo 3, por regras fixas (spec 17.2; ADR-022)."""

    def get(self, request):
        return Response(gerar_dicas(request.user, _mes_da_requisicao(request)))


class ResumoAnualView(APIView):
    """Receitas e despesas de cada um dos 12 meses do ano (spec 6.6)."""

    def get(self, request):
        texto = request.query_params.get("ano") or str(timezone.localdate().year)
        if not re.fullmatch(r"\d{4}", texto) or int(texto) < 1:
            raise ValidationError({"ano": ["Use o formato AAAA, ex.: 2026."]})
        ano = int(texto)

        por_mes = {numero: [Decimal("0"), Decimal("0")] for numero in range(1, 13)}
        transacoes = Transacao.objects.filter(categoria__usuario=request.user, data__year=ano)
        for valor, tipo, data in transacoes.values_list("valor", "categoria__tipo", "data"):
            por_mes[data.month][0 if tipo == TipoCategoria.RECEITA else 1] += valor

        receitas = sum((r for r, _ in por_mes.values()), Decimal("0"))
        despesas = sum((d for _, d in por_mes.values()), Decimal("0"))
        return Response(
            {
                "ano": ano,
                **_totais(receitas, despesas),
                "meses": [
                    {"mes": f"{ano:04d}-{numero:02d}", **_totais(r, d)} for numero, (r, d) in por_mes.items()
                ],
            }
        )

