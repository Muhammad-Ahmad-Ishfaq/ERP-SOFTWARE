from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'user-profiles', UserProfileViewSet, basename='user-profile')

urlpatterns = [
    path('', include(router.urls)),
]