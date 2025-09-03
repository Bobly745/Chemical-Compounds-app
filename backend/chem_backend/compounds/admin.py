# compounds/admin.py
from django.contrib import admin
from .models import Compound

@admin.register(Compound)
class CompoundAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "formula",
        "smiles",
        "molecular_weight",
        "is_public",
        "owner",
        "created_at",
    )
    list_filter = ("is_public", "owner", "created_at")
    search_fields = ("name", "formula", "smiles", "description")
    ordering = ("name",)
    date_hierarchy = "created_at"
    raw_id_fields = ("owner",)  # évite un menu déroulant trop long si beaucoup d'utilisateurs
