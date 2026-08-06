from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseMasterViewSet

router = DefaultRouter()
router.register(r'purchase-master', PurchaseMasterViewSet, basename='purchase-master')

urlpatterns = [
    path('', include(router.urls)),
]