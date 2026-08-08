# apps/purchaseOrders/serializers.py
from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import PurchaseOrderMaster, PurchaseOrderDetail
from apps.accounting.models import Party
from apps.users.models import User

class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    item_code_display = serializers.CharField(source='item_code.item_code', read_only=True)
    uom_display = serializers.CharField(source='uom.SHORT_NAME', read_only=True)

    # ─── Weight fields ────────────────────────────────────────────────────
    weight_kg = serializers.DecimalField(max_digits=15, decimal_places=3, required=False)
    weight_lbs = serializers.DecimalField(max_digits=15, decimal_places=3, read_only=True)

    class Meta:
        model = PurchaseOrderDetail
        fields = (
            'id', 'vsn', 'item_code', 'item_code_display',
            'uom', 'uom_display',
            'qty', 'rate', 'amount',
            'weight_kg', 'weight_lbs'
        )
        extra_kwargs = {
            'weight_kg': {'required': False},
        }


class PurchaseOrderMasterSerializer(serializers.ModelSerializer):
    details = PurchaseOrderDetailSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrderMaster
        fields = (
            'id', 'vtype', 'vno', 'vdate', 'supplier', 'supplier_name',
            'remarks', 'stts', 'user_no', 'details'
        )


class PurchaseOrderMasterCreateSerializer(serializers.ModelSerializer):
    details = PurchaseOrderDetailSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrderMaster
        fields = (
            'vtype', 'vno', 'vdate', 'supplier', 'remarks', 'stts', 'user_no', 'details'
        )
        extra_kwargs = {
            'vtype': {'required': True},
            'vno': {'required': True},
            'vdate': {'required': True},
            'supplier': {'required': True, 'allow_null': False},
        }

    def validate(self, data):
        # ... existing validation (same as before, but no weight_per_unit validation) ...
        # (copy from your current working version, just remove weight_per_unit)
        return data

    @transaction.atomic
    def create(self, validated_data):
        details_data = validated_data.pop('details', [])
        po = PurchaseOrderMaster.objects.create(**validated_data)
        for detail in details_data:
            PurchaseOrderDetail.objects.create(
                vtype=po.vtype,
                vno=po.vno,
                purchase_order_master=po,
                **detail
            )
        return po

    @transaction.atomic
    def update(self, instance, validated_data):
        details_data = validated_data.pop('details', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if details_data is not None:
            instance.details.all().delete()
            for detail in details_data:
                PurchaseOrderDetail.objects.create(
                    vtype=instance.vtype,
                    vno=instance.vno,
                    purchase_order_master=instance,
                    **detail
                )
        return instance