from rest_framework import serializers

from financas.models import Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    transacoes = serializers.IntegerField(source="num_transacoes", read_only=True, default=0)

    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "cor", "transacoes", "criado_em"]
        read_only_fields = ["id", "criado_em"]

    def _usuario(self):
        return self.context["request"].user

    def validate_nome(self, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise serializers.ValidationError("Informe o nome.")
        existentes = Categoria.objects.filter(usuario=self._usuario(), nome__iexact=valor)
        if self.instance is not None:
            existentes = existentes.exclude(pk=self.instance.pk)
        if existentes.exists():
            raise serializers.ValidationError("Já existe uma categoria com esse nome.")
        return valor

    def validate_cor(self, valor: str) -> str:
        return valor.upper()

    def validate_tipo(self, valor: str) -> str:
        # ADR-004: mudar o tipo inverteria o sinal do histórico.
        if (
            self.instance is not None
            and valor != self.instance.tipo
            and self.instance.transacoes.exists()
        ):
            raise serializers.ValidationError(
                "Não é possível alterar o tipo de uma categoria que já tem transações."
            )
        return valor
