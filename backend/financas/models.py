from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.functions import Lower


class TipoCategoria(models.TextChoices):
    RECEITA = "RECEITA", "Receita"
    DESPESA = "DESPESA", "Despesa"


validar_cor_hex = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="Informe a cor no formato hexadecimal #RRGGBB.",
)


class Categoria(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categorias"
    )
    nome = models.CharField(max_length=50)
    tipo = models.CharField(max_length=7, choices=TipoCategoria.choices)
    cor = models.CharField(max_length=7, default="#64748B", validators=[validar_cor_hex])
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]
        constraints = [
            models.UniqueConstraint(
                Lower("nome"), "usuario", name="categoria_nome_unico_por_usuario"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.nome} ({self.get_tipo_display()})"


class Transacao(models.Model):
    """Lançamento financeiro. Tipo e dono vêm da categoria (ADR-004)."""

    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name="transacoes"
    )
    descricao = models.CharField(max_length=120)
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data = models.DateField()
    observacao = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(valor__gt=0), name="transacao_valor_positivo"
            ),
        ]
        indexes = [models.Index(fields=["categoria", "data"], name="transacao_categoria_data")]

    def __str__(self) -> str:
        return f"{self.descricao} — {self.valor}"

    @property
    def tipo(self) -> str:
        return self.categoria.tipo

    @property
    def usuario(self):
        return self.categoria.usuario
