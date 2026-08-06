from rest_framework import viewsets, permissions
from .models import VType
from .serializers import VTypeSerializer

class VTypeViewSet(viewsets.ModelViewSet):
    queryset = VType.objects.all()
    serializer_class = VTypeSerializer
    permission_classes = [permissions.AllowAny]  # adjust later