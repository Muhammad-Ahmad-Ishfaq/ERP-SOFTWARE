from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VTypeViewSet

router = DefaultRouter()
router.register(r'vtypes', VTypeViewSet, basename='vtype')

urlpatterns = [
    path('', include(router.urls)),
]