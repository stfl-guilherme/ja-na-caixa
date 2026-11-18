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
