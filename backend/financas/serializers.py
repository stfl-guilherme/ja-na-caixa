from rest_framework import serializers

from financas.models import Categoria, TipoCategoria, Transacao


class CategoriaSerializer(serializers.ModelSerializer):
    transacoes = serializers.IntegerField(source="num_transacoes", read_only=True, default=0)

    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "cor", "limite_mensal", "transacoes", "criado_em"]
        read_only_fields = ["id", "criado_em"]
        extra_kwargs = {"limite_mensal": {"required": False}}

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

    def validate_limite_mensal(self, valor):
        if valor is not None and valor <= 0:
            raise serializers.ValidationError("O limite deve ser maior que zero.")
        return valor

    def validate(self, dados):
        # ADR-021: só despesas têm limite. Na troca para receita, o limite sai no mesmo request.
        tipo = dados.get("tipo", getattr(self.instance, "tipo", None))
        if "limite_mensal" in dados:
            limite = dados["limite_mensal"]
        else:
            limite = getattr(self.instance, "limite_mensal", None)
        if tipo == TipoCategoria.RECEITA and limite is not None:
            if self.instance is not None and self.instance.tipo == TipoCategoria.DESPESA:
                mensagem = "Categorias de receita não têm limite. Remova o limite para mudar o tipo."
            else:
                mensagem = "Só categorias de despesa podem ter limite mensal."
            raise serializers.ValidationError({"limite_mensal": [mensagem]})
        return dados


class TransacaoSerializer(serializers.ModelSerializer):
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.none())
    categoria_nome = serializers.CharField(source="categoria.nome", read_only=True)
    categoria_cor = serializers.CharField(source="categoria.cor", read_only=True)
    tipo = serializers.CharField(source="categoria.tipo", read_only=True)
    forma_pagamento_rotulo = serializers.CharField(source="get_forma_pagamento_display", read_only=True)

    class Meta:
        model = Transacao
        fields = [
            "id",
            "categoria",
            "categoria_nome",
            "categoria_cor",
            "tipo",
            "descricao",
            "valor",
            "data",
            "observacao",
            "forma_pagamento",
            "forma_pagamento_rotulo",
            "fixa",
            "repetida_de",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "repetida_de", "criado_em", "atualizado_em"]
        extra_kwargs = {"observacao": {"required": False, "allow_blank": True}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            # Só categorias do usuário são aceitas; as demais viram 400.
            self.fields["categoria"].queryset = Categoria.objects.filter(usuario=request.user)

    def validate_descricao(self, valor: str) -> str:
        valor = valor.strip()
        if not valor:
            raise serializers.ValidationError("Informe a descrição.")
        return valor

    def validate_valor(self, valor):
        if valor <= 0:
            raise serializers.ValidationError("O valor deve ser maior que zero.")
        return valor


class RepetirFixasSerializer(serializers.Serializer):
    """Corpo de POST /api/transacoes/repetir-fixas/ (spec 17.4)."""

    mes = serializers.CharField()
    ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)

    def to_internal_value(self, dados):
        ids = dados.get("ids") if hasattr(dados, "get") else None
        # O IntegerField do DRF aceita true/"1"; aqui só valem números inteiros.
        if isinstance(ids, list) and any(isinstance(i, bool) or not isinstance(i, int) for i in ids):
            raise serializers.ValidationError({"ids": ["Informe uma lista de ids numéricos."]})
        return super().to_internal_value(dados)
