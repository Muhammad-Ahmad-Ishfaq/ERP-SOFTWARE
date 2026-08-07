# apps/inventory/serializers.py
from rest_framework import serializers
from .models import Item, Unit


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    uom_name = serializers.CharField(source='UOM.SHORT_NAME', read_only=True)

    class Meta:
        model = Item
        fields = [
            'ITEM_ID', 'ITEM_CODE', 'ITEM_NAME', 'ITEM_DESCRIPTION',
            'UOM', 'uom_name',
            'COST_PRICE', 'MIN_STOCK', 'MAX_STOCK', 'REORDER_LEVEL',
            'MORE_DETAIL', 'STATUS',
            'CREATED_BY', 'UPDATED_BY',
            'CREATED_AT', 'UPDATED_AT'
        ]
        read_only_fields = ['ITEM_ID', 'ITEM_CODE', 'CREATED_AT', 'UPDATED_AT']

    def validate_ITEM_NAME(self, value):
        """Prevent duplicate item names (including inactive items)."""
        # Check if any item (active or inactive) has the same name
        if Item.all_objects.filter(ITEM_NAME__iexact=value).exists():
            raise serializers.ValidationError("An item with this name already exists.")
        return value