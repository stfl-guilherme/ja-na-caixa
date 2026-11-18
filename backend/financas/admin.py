from django.contrib import admin

from financas.models import Categoria, Transacao


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nome", "tipo", "cor", "usuario"]
    list_filter = ["tipo", "usuario"]
    search_fields = ["nome"]


@admin.register(Transacao)
class TransacaoAdmin(admin.ModelAdmin):
    list_display = ["data", "descricao", "valor", "categoria"]
    list_filter = ["categoria__tipo", "categoria__usuario"]
    search_fields = ["descricao"]
    date_hierarchy = "data"
    list_select_related = ["categoria"]
