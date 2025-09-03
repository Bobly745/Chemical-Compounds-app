from django.urls import path
from . import views

urlpatterns = [
    path('private/', views.get_compounds, name='get_compounds'),  # vue protégée (personnelle ou admin)
    path('public/', views.get_all_compounds, name='get_all_compounds_public'),  # ✅ nouvelle vue)
    path('add/', views.add_compound, name='add_compound'),
    path('<int:compound_id>/', views.get_compound_detail, name='compound_detail'),
    path('<int:compound_id>/update/', views.update_compound, name='update_compound'),
    path('<int:compound_id>/delete/', views.delete_compound, name='delete_compound'),
]
