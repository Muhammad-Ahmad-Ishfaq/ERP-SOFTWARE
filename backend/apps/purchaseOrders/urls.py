from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderMasterViewSet

router = DefaultRouter()
router.register(r'purchase-orders', PurchaseOrderMasterViewSet, basename='purchase-order')

urlpatterns = [
    path('', include(router.urls)),
]