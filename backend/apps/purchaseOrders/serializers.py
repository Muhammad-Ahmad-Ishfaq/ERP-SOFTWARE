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
    weight_per_unit = serializers.DecimalField(max_digits=10, decimal_places=3, required=False)
    weight_kg = serializers.DecimalField(max_digits=15, decimal_places=3, required=False)
    weight_lbs = serializers.DecimalField(max_digits=15, decimal_places=3, read_only=True)

    class Meta:
        model = PurchaseOrderDetail
        fields = (
            'id', 'vsn', 'item_code', 'item_code_display',
            'uom', 'uom_display',
            'qty', 'rate', 'amount',
            'weight_per_unit', 'weight_kg', 'weight_lbs'
        )
        extra_kwargs = {
            'weight_per_unit': {'required': False},
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
        print("📥 Incoming PO data:", data)

        required = ['vtype', 'vno', 'vdate', 'supplier']
        for field in required:
            if not data.get(field):
                raise serializers.ValidationError({field: f"{field} is required."})

        supplier = data.get('supplier')
        if supplier:
            try:
                party = Party.objects.get(id=supplier.id if hasattr(supplier, 'id') else supplier)
                if party.sub != 'creditor':
                    raise serializers.ValidationError({
                        "supplier": "Selected party must be a creditor (supplier)."
                    })
            except Party.DoesNotExist:
                raise serializers.ValidationError({"supplier": "Supplier does not exist."})

        details = data.get('details', [])
        if not details:
            raise serializers.ValidationError({"details": "At least one item is required."})

        for idx, detail in enumerate(details):
            row = idx + 1
            if not detail.get('item_code'):
                raise serializers.ValidationError({"details": f"Item is required for row {row}."})
            if not detail.get('uom'):
                raise serializers.ValidationError({"details": f"UOM is required for row {row}."})
            qty = detail.get('qty')
            if qty is None or float(qty) <= 0:
                raise serializers.ValidationError({"details": f"Quantity must be > 0 for row {row}."})
            rate = detail.get('rate')
            if rate is None or float(rate) <= 0:
                raise serializers.ValidationError({"details": f"Rate must be > 0 for row {row}."})
            if 'amount' not in detail or not detail['amount']:
                detail['amount'] = float(qty) * float(rate)

            # weight_kg validation (optional)
            weight_kg = detail.get('weight_kg')
            if weight_kg is not None and float(weight_kg) < 0:
                raise serializers.ValidationError({
                    "details": f"Weight (kg) must be >= 0 for row {row}."
                })

        user_no = data.get('user_no')
        if user_no:
            if not isinstance(user_no, User) and not isinstance(user_no, int):
                raise serializers.ValidationError({"user_no": "Invalid user."})
            try:
                if isinstance(user_no, int):
                    User.objects.get(id=user_no)
            except User.DoesNotExist:
                raise serializers.ValidationError({"user_no": "User does not exist."})

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