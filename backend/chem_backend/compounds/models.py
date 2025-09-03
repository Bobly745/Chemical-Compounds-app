from django.db import models
from django.conf import settings
from django.utils import timezone

class Compound(models.Model):
    # Core fields
    name = models.CharField(max_length=100, db_index=True)
    formula = models.CharField(max_length=100, db_index=True)
    smiles = models.CharField(max_length=255, db_index=True)
    molecular_weight = models.FloatField(null=True, blank=True)  # ← devient optionnel
    structure_file = models.FileField(upload_to="structures3d/", null=True, blank=True)
    description = models.TextField(blank=True)

    # Visibility
    is_public = models.BooleanField(default=True, db_index=True)

    # Ownership
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="compounds",
        db_index=True,
    )

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["formula"]),
            models.Index(fields=["smiles"]),
            models.Index(fields=["is_public"]),
            models.Index(fields=["owner", "is_public"]),
        ]

    def __str__(self):
        return self.name
