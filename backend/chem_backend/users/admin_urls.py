# users/admin_urls.py
from django.urls import path
from . import admin_views

urlpatterns = [
    # Users
    path("users/", admin_views.admin_list_users, name="admin_list_users"),
    path("users/<int:user_id>/set_active/", admin_views.admin_set_active, name="admin_set_active"),  # ✅ NEW
    path("users/<int:user_id>/set_admin/", admin_views.admin_set_admin, name="admin_set_admin"),

    # Compounds
    path("compounds/", admin_views.admin_list_compounds, name="admin_list_compounds"),
    path("compounds/<int:compound_id}/update/", admin_views.admin_update_compound, name="admin_update_compound"),
    path("compounds/<int:compound_id}/delete/", admin_views.admin_delete_compound, name="admin_delete_compound"),
]
