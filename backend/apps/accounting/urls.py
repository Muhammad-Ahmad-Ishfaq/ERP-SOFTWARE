from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PartyViewSet, VoucherViewSet

router = DefaultRouter()
router.register(r'parties', PartyViewSet, basename='party')
router.register(r'vouchers', VoucherViewSet, basename='voucher')

urlpatterns = [
    path('', include(router.urls)),
]