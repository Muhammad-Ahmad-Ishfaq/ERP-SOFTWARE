# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.db import IntegrityError
import json

from .models import Unit, Item
from .serializers import UnitSerializer, ItemSerializer


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def create(self, request, *args, **kwargs):
        """Override create to log and validate incoming data"""
        print("=" * 60)
        print("📥 INCOMING ITEM DATA:")
        print(f"   Request data: {request.data}")
        print(f"   Request user: {request.user}")
        print("=" * 60)
        
        # Try to validate the data
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ VALIDATION ERRORS:")
            for field, errors in serializer.errors.items():
                print(f"   {field}: {errors}")
            print("=" * 60)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print("✅ Validation passed!")
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Auto-set created_by when creating item"""
        user = self.request.user
        print(f"📥 Creating item with user: {user} (ID: {user.id})")
        serializer.save(CREATED_BY=user)
    
    def perform_update(self, serializer):
        """Auto-set updated_by when updating item"""
        user = self.request.user
        print(f"📥 Updating item with user: {user} (ID: {user.id})")
        serializer.save(UPDATED_BY=user)