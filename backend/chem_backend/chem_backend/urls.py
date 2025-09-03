from django.contrib import admin
from django.urls import path, include
from users.views import csrf_token_view  # CSRF endpoint

urlpatterns = [
    path("admin/", admin.site.urls),

    # CSRF cookie bootstrap
    path("api/csrf/", csrf_token_view, name="csrf"),

    # Auth
    path("api/auth/", include("users.urls")),

    # Compounds
    path("api/compounds/", include("compounds.urls")),

    # Admin API (custom)
    path("api/admin/", include("users.admin_urls")),
]

# (optionnel) médias en dev
from django.conf import settings
from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
