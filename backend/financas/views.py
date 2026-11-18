from django.db.models import Count, ProtectedError
from rest_framework import status, viewsets
from rest_framework.response import Response

from financas.models import Categoria, TipoCategoria
from financas.serializers import CategoriaSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        # Objetos de outro usuário ficam fora do queryset → 404 (spec 6.5).
        queryset = Categoria.objects.filter(usuario=self.request.user).annotate(
            num_transacoes=Count("transacoes")
        )
        tipo = self.request.query_params.get("tipo")
        if tipo in TipoCategoria.values:
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
