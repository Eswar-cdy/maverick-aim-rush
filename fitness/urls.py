from django.urls import path
from .views import NutritionLogView

urlpatterns = [
    path('nutrition-log/', NutritionLogView.as_view(), name='nutrition_log'),
]
