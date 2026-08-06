from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UnitViewSet, ItemViewSet

# Create a router
router = DefaultRouter()
router.register(r'units', UnitViewSet, basename='unit')
router.register(r'items', ItemViewSet, basename='item')

urlpatterns = [
    path('inventory/', include(router.urls)),
]