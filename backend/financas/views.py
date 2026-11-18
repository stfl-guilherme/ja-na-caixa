from decimal import Decimal

from django.db.models import Count, ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from financas.filters import filtrar_transacoes, intervalo_do_mes
from financas.models import Categoria, TipoCategoria, Transacao
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
    page_size = 20


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


class ResumoView(APIView):
    """Totais do mês. Somas em Decimal no Python: o front não soma dinheiro (ADR-005)."""

    def get(self, request):
        mes = request.query_params.get("mes") or timezone.localdate().strftime("%Y-%m")
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
                },
            )
            item["total"] += transacao.valor

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
            }
        )
