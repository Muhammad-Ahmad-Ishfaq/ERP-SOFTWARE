from rest_framework import viewsets, permissions
from .models import ACSetup
from .serializers import ACSetupSerializer

class ACSetupViewSet(viewsets.ModelViewSet):
    queryset = ACSetup.objects.all()
    serializer_class = ACSetupSerializer
    permission_classes = [permissions.AllowAny]