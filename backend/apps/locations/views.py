from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.AllowAny]  # adjust later