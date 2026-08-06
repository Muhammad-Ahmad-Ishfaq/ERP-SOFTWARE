# apps/sales/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleMasterViewSet

router = DefaultRouter()
router.register(r'sale-master', SaleMasterViewSet, basename='sale-master')

urlpatterns = [
    path('', include(router.urls)),
]