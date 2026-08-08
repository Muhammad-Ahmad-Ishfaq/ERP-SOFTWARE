# apps/sales/serializers.py
from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal
from .models import SaleMaster, SaleDetail
from apps.accounting.models import VoucherMaster, VoucherDetail, Party
from apps.ac_setup.models import ACSetup
from apps.locations.models import Location


class SaleDetailSerializer(serializers.ModelSerializer):
    item_code_display = serializers.CharField(source='item_code.item_code', read_only=True)
    uom_display = serializers.CharField(source='uom.SHORT_NAME', read_only=True)
    location_display = serializers.CharField(source='location.name', read_only=True)

    # Weight fields
    weight_per_unit = serializers.DecimalField(max_digits=10, decimal_places=3, required=False)
    weight_kg = serializers.DecimalField(max_digits=15, decimal_places=3, read_only=True)
    weight_lbs = serializers.DecimalField(max_digits=15, decimal_places=3, read_only=True)

    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = SaleDetail
        fields = (
            'vsn', 'item_code', 'item_code_display',
            'uom', 'uom_display',
            'qty', 'rate', 'amount',
            'location', 'location_display',
            'weight_per_unit', 'weight_kg', 'weight_lbs'
        )
        extra_kwargs = {
            'location': {'required': False, 'allow_null': True}
        }


class SaleMasterSerializer(serializers.ModelSerializer):
    details = SaleDetailSerializer(many=True, read_only=True)
    account_code_display = serializers.CharField(source='account_code.name', read_only=True)
    sale_code_display = serializers.CharField(source='sale_code.name', read_only=True)

    class Meta:
        model = SaleMaster
        fields = (
            'id', 'vtype', 'vno', 'vdate', 'dc_no',
            'account_code', 'account_code_display',
            'sale_code', 'sale_code_display',
            'remarks', 'discount', 'stts', 'user_no',
            'voucher_created',
            'details'
        )


class SaleMasterCreateSerializer(serializers.ModelSerializer):
    details = SaleDetailSerializer(many=True, required=False)

    class Meta:
        model = SaleMaster
        fields = (
            'vtype', 'vno', 'vdate', 'dc_no',
            'account_code', 'sale_code',
            'remarks', 'discount', 'stts', 'user_no',
            'details'
        )
        extra_kwargs = {
            'sale_code': {'required': False, 'allow_null': True},
            'account_code': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        print("📥 Incoming sale data:", data)

        if not data.get('vtype'):
            raise serializers.ValidationError({"vtype": "Voucher type is required."})
        if not data.get('vno'):
            raise serializers.ValidationError({"vno": "Voucher number is required."})
        if not data.get('vdate'):
            raise serializers.ValidationError({"vdate": "Date is required."})

        customer = data.get('account_code')
        if not customer:
            raise serializers.ValidationError({"account_code": "Customer is required."})
        if not isinstance(customer, Party):
            raise serializers.ValidationError({"account_code": "Invalid customer."})
        if customer.sub != 'debtor':
            raise serializers.ValidationError({"account_code": "Selected account is not a debtor."})

        # Get sale account from AC_SETUP
        setup = ACSetup.objects.first()
        if not setup:
            raise serializers.ValidationError({"sale_code": "AC_SETUP configuration not found."})
        if not setup.sale_code:
            raise serializers.ValidationError({"sale_code": "No sale account configured in AC_SETUP."})

        sale_account = setup.sale_code
        if isinstance(sale_account, Party):
            sale_party = sale_account
        else:
            try:
                sale_party = Party.objects.get(id=sale_account)
            except Party.DoesNotExist:
                raise serializers.ValidationError({"sale_code": f"Invalid sale account {sale_account} in AC_SETUP."})

        data['sale_code'] = sale_party

        # Validate details
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

            # Validate location (optional)
            loc = detail.get('location')
            if loc is not None and not isinstance(loc, (int, Location)):
                try:
                    loc = int(loc)
                except (ValueError, TypeError):
                    raise serializers.ValidationError({"details": f"Invalid location for row {row}."})
                detail['location'] = loc

            # Validate weight_per_unit (optional, must be >= 0)
            weight_per_unit = detail.get('weight_per_unit')
            if weight_per_unit is not None and Decimal(str(weight_per_unit)) < 0:
                raise serializers.ValidationError({
                    "details": f"Weight per unit must be >= 0 for row {row}."
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        details_data = validated_data.pop('details', [])
        print("🔍 DEBUG: Sale details data received:", details_data)

        sale = SaleMaster.objects.create(**validated_data)

        for detail in details_data:
            location = detail.pop('location', None)
            SaleDetail.objects.create(
                vtype=sale.vtype,
                vno=sale.vno,
                sale_master=sale,
                location=location,
                **detail
            )

        if sale.stts == 'C':
            self._create_voucher(sale)
        return sale

    @transaction.atomic
    def update(self, instance, validated_data):
        details_data = validated_data.pop('details', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if details_data is not None:
            instance.details.all().delete()
            for detail in details_data:
                location = detail.pop('location', None)
                SaleDetail.objects.create(
                    vtype=instance.vtype,
                    vno=instance.vno,
                    sale_master=instance,
                    location=location,
                    **detail
                )

        if instance.stts == 'C' and not instance.voucher_created:
            self._create_voucher(instance)
        return instance

    def _create_voucher(self, sale):
        from datetime import datetime

        total_amount = sale.details.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        if total_amount == 0:
            return

        customer = sale.account_code
        sale_account = sale.sale_code
        if not customer or not sale_account:
            return

        net_amount = total_amount - (sale.discount or Decimal('0.00'))
        year = str(datetime.now().year)

        with transaction.atomic():
            voucher = VoucherMaster.objects.create(
                year=year,
                vtype=sale.vtype,
                vno=sale.vno,
                vdate=sale.vdate,
                remarks=sale.remarks or f"Auto-generated from Sale #{sale.vno}",
                status='A',
                received_by=None,
                user_no=sale.user_no.USER_ID if sale.user_no else 1
            )

            VoucherDetail.objects.create(
                year=year,
                vtype=sale.vtype,
                vno=sale.vno,
                vsn=1,
                account_code=customer,
                narration=f"{customer.name} - Sale (Invoice #{sale.vno})",
                debit=net_amount,
                credit=0,
                voucher_master=voucher
            )

            VoucherDetail.objects.create(
                year=year,
                vtype=sale.vtype,
                vno=sale.vno,
                vsn=2,
                account_code=sale_account,
                narration=f"{sale_account.name} - Sales revenue (Invoice #{sale.vno})",
                debit=0,
                credit=net_amount,
                voucher_master=voucher
            )

            sale.voucher_created = True
            sale.save(update_fields=['voucher_created'])