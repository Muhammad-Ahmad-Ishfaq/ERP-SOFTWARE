# apps/inventory/serializers.py
from rest_framework import serializers
from .models import Unit, Item


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = "__all__"


class ItemSerializer(serializers.ModelSerializer):
    # Read-only fields for related data
    unit_name = serializers.CharField(source='UOM.UOM_NAME', read_only=True)
    unit_short_name = serializers.CharField(source='UOM.SHORT_NAME', read_only=True)
    
    class Meta:
        model = Item
        fields = "__all__"
        read_only_fields = [
            'ITEM_CODE', 
            'CREATED_AT', 
            'UPDATED_AT', 
            'CREATED_BY',  # ✅ Make CREATED_BY read-only (auto-set by view)
            'UPDATED_BY'   # ✅ Make UPDATED_BY read-only (auto-set by view)
        ]