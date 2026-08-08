# apps/saleOrder/serializers.py
from rest_framework import serializers          # ✅ this was missing
from django.db import transaction
from decimal import Decimal
from .models import SaleOrderMaster, SaleOrderDetail
from apps.accounting.models import Party
from apps.users.models import User


class SaleOrderDetailSerializer(serializers.ModelSerializer):
    item_code_display = serializers.CharField(source='item_code.item_code', read_only=True)
    uom_display = serializers.CharField(source='uom.SHORT_NAME', read_only=True)

    # weight_kg writable, weight_lbs read‑only
    weight_kg = serializers.DecimalField(max_digits=15, decimal_places=3, required=False)
    weight_lbs = serializers.DecimalField(max_digits=15, decimal_places=3, read_only=True)

    class Meta:
        model = SaleOrderDetail
        fields = (
            'id', 'vsn', 'item_code', 'item_code_display',
            'uom', 'uom_display',
            'qty', 'rate', 'amount',
            'weight_kg', 'weight_lbs'
        )
        extra_kwargs = {
            'weight_kg': {'required': False},
        }


class SaleOrderMasterSerializer(serializers.ModelSerializer):
    details = SaleOrderDetailSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = SaleOrderMaster
        fields = (
            'id', 'vtype', 'vno', 'vdate', 'customer', 'customer_name',
            'remarks', 'stts', 'user_no', 'details'
        )


class SaleOrderMasterCreateSerializer(serializers.ModelSerializer):
    details = SaleOrderDetailSerializer(many=True, required=False)

    class Meta:
        model = SaleOrderMaster
        fields = (
            'vtype', 'vno', 'vdate', 'customer', 'remarks', 'stts', 'user_no', 'details'
        )
        extra_kwargs = {
            'vtype': {'required': True},
            'vno': {'required': True},
            'vdate': {'required': True},
            'customer': {'required': True, 'allow_null': False},
        }

    def validate(self, data):
        print("📥 Incoming SO data:", data)

        if not data.get('vtype'):
            raise serializers.ValidationError({"vtype": "Voucher type is required."})
        if not data.get('vno'):
            raise serializers.ValidationError({"vno": "Voucher number is required."})
        if not data.get('vdate'):
            raise serializers.ValidationError({"vdate": "Date is required."})

        customer = data.get('customer')
        if not customer:
            raise serializers.ValidationError({"customer": "Customer is required."})
        if not isinstance(customer, Party):
            raise serializers.ValidationError({"customer": "Invalid customer."})
        if customer.sub != 'debtor':
            raise serializers.ValidationError({"customer": "Selected account is not a debtor."})

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
            if qty is None or Decimal(str(qty)) <= 0:
                raise serializers.ValidationError({"details": f"Quantity must be > 0 for row {row}."})
            rate = detail.get('rate')
            if rate is None or Decimal(str(rate)) <= 0:
                raise serializers.ValidationError({"details": f"Rate must be > 0 for row {row}."})
            if 'amount' not in detail or not detail['amount']:
                detail['amount'] = Decimal(str(qty)) * Decimal(str(rate))

            weight_kg = detail.get('weight_kg')
            if weight_kg is not None and Decimal(str(weight_kg)) < 0:
                raise serializers.ValidationError({
                    "details": f"Weight (kg) must be >= 0 for row {row}."
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        details_data = validated_data.pop('details', [])
        so = SaleOrderMaster.objects.create(**validated_data)
        for detail in details_data:
            SaleOrderDetail.objects.create(
                vtype=so.vtype,
                vno=so.vno,
                sale_order_master=so,
                **detail
            )
        return so

    @transaction.atomic
    def update(self, instance, validated_data):
        details_data = validated_data.pop('details', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if details_data is not None:
            instance.details.all().delete()
            for detail in details_data:
                SaleOrderDetail.objects.create(
                    vtype=instance.vtype,
                    vno=instance.vno,
                    sale_order_master=instance,
                    **detail
                )
        return instance