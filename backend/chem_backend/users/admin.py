# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ["email", "full_name", "role", "is_active", "is_staff", "date_joined"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser"]
    search_fields = ["email", "full_name"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name",)}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "role", "is_staff", "is_superuser"),
        }),
    )

    # Map to USERNAME_FIELD
    def get_fieldsets(self, request, obj=None):
        return super().get_fieldsets(request, obj)


# Register your models here.
