from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ACSetupViewSet

router = DefaultRouter()
router.register(r'account-setup', ACSetupViewSet, basename='account-setup')

urlpatterns = [
    path('', include(router.urls)),
]