from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum
from decimal import Decimal
from .models import PurchaseMaster, PurchaseDetail
from apps.accounting.models import VoucherMaster, VoucherDetail, Party
from apps.ac_setup.models import ACSetup
from apps.locations.models import Location

class PurchaseDetailSerializer(serializers.ModelSerializer):
    item_code_display = serializers.CharField(source='item_code.item_code', read_only=True)
    uom_display = serializers.CharField(source='uom.SHORT_NAME', read_only=True)
    location_display = serializers.CharField(source='location.name', read_only=True)

    # Explicitly define location as PrimaryKeyRelatedField
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = PurchaseDetail
        fields = (
            'vsn', 'item_code', 'item_code_display',
            'uom', 'uom_display',
            'qty', 'rate', 'amount',
            'location', 'location_display'
        )
        extra_kwargs = {
            'location': {'required': False, 'allow_null': True}
        }


class PurchaseMasterSerializer(serializers.ModelSerializer):
    details = PurchaseDetailSerializer(many=True, read_only=True)
    account_code_display = serializers.CharField(source='account_code.name', read_only=True)
    purchase_code_display = serializers.CharField(source='purchase_code.name', read_only=True)

    class Meta:
        model = PurchaseMaster
        fields = (
            'id', 'vtype', 'vno', 'vdate', 'dc_no',
            'account_code', 'account_code_display',
            'purchase_code', 'purchase_code_display',
            'remarks', 'discount', 'stts', 'user_no',
            'voucher_created',
            'details'
        )


class PurchaseMasterCreateSerializer(serializers.ModelSerializer):
    details = PurchaseDetailSerializer(many=True, required=False)

    class Meta:
        model = PurchaseMaster
        fields = (
            'vtype', 'vno', 'vdate', 'dc_no',
            'account_code', 'purchase_code',
            'remarks', 'discount', 'stts', 'user_no',
            'details'
        )
        extra_kwargs = {
            'purchase_code': {'required': False, 'allow_null': True},
            'account_code': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        print("📥 Incoming data for purchase creation:", data)

        if not data.get('vtype'):
            raise serializers.ValidationError({"vtype": "Voucher type is required."})
        if not data.get('vno'):
            raise serializers.ValidationError({"vno": "Voucher number is required."})
        if not data.get('vdate'):
            raise serializers.ValidationError({"vdate": "Date is required."})

        supplier = data.get('account_code')
        if not supplier:
            raise serializers.ValidationError({"account_code": "Supplier is required."})

        if not isinstance(supplier, Party):
            raise serializers.ValidationError({"account_code": "Invalid supplier."})

        if supplier.sub != "creditor":
            raise serializers.ValidationError({"account_code": "Selected account is not a supplier."})

        setup = ACSetup.objects.first()
        if not setup:
            raise serializers.ValidationError({"purchase_code": "AC_SETUP configuration not found."})
        if not setup.purchase_code:
            raise serializers.ValidationError({"purchase_code": "No purchase account configured in AC_SETUP."})

        purchase_account = setup.purchase_code
        if isinstance(purchase_account, Party):
            purchase_party = purchase_account
        else:
            try:
                purchase_party = Party.objects.get(id=purchase_account)
            except (Party.DoesNotExist, ValueError, TypeError):
                raise serializers.ValidationError({
                    "purchase_code": f"Invalid purchase account {purchase_account} in AC_SETUP."
                })

        if purchase_party.sub != "inventory":
            raise serializers.ValidationError({
                "purchase_code": f"Account '{purchase_party.name}' is not configured as inventory account."
            })

        data['purchase_code'] = purchase_party

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

            # Optional: validate location is an integer if provided
            loc = detail.get('location')
            if loc is not None and not isinstance(loc, (int, Location)):
                try:
                    loc = int(loc)
                except (ValueError, TypeError):
                    raise serializers.ValidationError({"details": f"Invalid location for row {row}."})
                detail['location'] = loc

        discount = data.get('discount') or Decimal('0.00')
        if discount < 0:
            raise serializers.ValidationError({"discount": "Discount cannot be negative."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        details_data = validated_data.pop('details', [])
        print("🔍 DEBUG: Details data received:", details_data)

        purchase = PurchaseMaster.objects.create(**validated_data)

        for detail in details_data:
            print("🔍 DEBUG: Detail before pop:", detail)
            location = detail.pop('location', None)
            print("🔍 DEBUG: Extracted location:", location)

            PurchaseDetail.objects.create(
                vtype=purchase.vtype,
                vno=purchase.vno,
                purchase_master=purchase,
                location=location,
                **detail
            )

        if purchase.stts == 'C':
            self._create_voucher(purchase)

        return purchase

    @transaction.atomic
    def update(self, instance, validated_data):
        details_data = validated_data.pop('details', None)
        print("🔍 DEBUG: Update details data:", details_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if details_data is not None:
            instance.details.all().delete()
            for detail in details_data:
                location = detail.pop('location', None)
                PurchaseDetail.objects.create(
                    vtype=instance.vtype,
                    vno=instance.vno,
                    purchase_master=instance,
                    location=location,
                    **detail
                )

        if instance.stts == 'C' and not instance.voucher_created:
            self._create_voucher(instance)

        return instance

    def _create_voucher(self, purchase):
        from datetime import datetime

        total_amount = purchase.details.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        if total_amount == 0:
            return

        supplier = purchase.account_code
        purchase_account = purchase.purchase_code
        if not supplier or not purchase_account:
            return

        discount = purchase.discount or Decimal('0.00')
        net_amount = total_amount - discount
        year = str(datetime.now().year)

        with transaction.atomic():
            voucher = VoucherMaster.objects.create(
                year=year,
                vtype=purchase.vtype,
                vno=purchase.vno,
                vdate=purchase.vdate,
                remarks=purchase.remarks or f"Auto-generated from Purchase #{purchase.vno}",
                status='A',
                received_by=None,
                user_no=purchase.user_no.USER_ID if purchase.user_no else 1
            )

            VoucherDetail.objects.create(
                year=year,
                vtype=purchase.vtype,
                vno=purchase.vno,
                vsn=1,
                account_code=purchase_account,
                narration=f"{purchase_account.name} - Purchase of goods (PO #{purchase.vno})",
                debit=net_amount,
                credit=0,
                voucher_master=voucher
            )

            VoucherDetail.objects.create(
                year=year,
                vtype=purchase.vtype,
                vno=purchase.vno,
                vsn=2,
                account_code=supplier,
                narration=f"{supplier.name} - Supplier credit (PO #{purchase.vno})",
                debit=0,
                credit=net_amount,
                voucher_master=voucher
            )

            purchase.voucher_created = True
            purchase.save(update_fields=['voucher_created'])