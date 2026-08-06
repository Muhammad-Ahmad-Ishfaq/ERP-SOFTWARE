from rest_framework import serializers
from django.db.models import Max
from .models import Party, VoucherMaster, VoucherDetail


class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = '__all__'


class VoucherDetailSerializer(serializers.ModelSerializer):
    account_title = serializers.CharField(source='account_code.name', read_only=True)

    class Meta:
        model = VoucherDetail
        fields = [
            'id', 'year', 'vtype', 'vno', 'vsn',
            'account_code', 'account_title',
            'narration', 'debit', 'credit',
            'branch', 'cheque_no', 'cheque_date', 'chq_title', 'due'
        ]
        read_only_fields = ['id', 'year', 'vtype', 'vno']


class VoucherMasterSerializer(serializers.ModelSerializer):
    details = serializers.ListField(
        child=VoucherDetailSerializer(),
        write_only=True,
        required=False,
        allow_empty=False
    )

    class Meta:
        model = VoucherMaster
        fields = [
            'id', 'year', 'vtype', 'vno', 'vdate',   # ✅ vno included
            'remarks', 'status', 'received_by', 'user_no',
            'details'
        ]
        read_only_fields = ['id', 'vno']

    def validate(self, data):
        details = self.initial_data.get('details', [])
        if not details:
            raise serializers.ValidationError({"details": "At least one detail entry is required."})
        total_debit = sum(float(d.get('debit', 0)) for d in details)
        total_credit = sum(float(d.get('credit', 0)) for d in details)
        if round(total_debit, 2) != round(total_credit, 2):
            raise serializers.ValidationError(
                f"Voucher is not balanced. Debit: {total_debit}, Credit: {total_credit}"
            )
        return data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['details'] = VoucherDetailSerializer(instance.details.all(), many=True).data
        return data

    def create(self, validated_data):
        validated_data.pop('details', None)

        year = validated_data['year']
        vtype = validated_data['vtype']
        last_no = VoucherMaster.objects.filter(year=year, vtype=vtype).aggregate(Max('vno'))['vno__max'] or 0
        validated_data['vno'] = last_no + 1

        voucher = VoucherMaster.objects.create(**validated_data)

        details_data = self.initial_data.get('details', [])
        for detail in details_data:
            detail.pop('account_title', None)
            detail.pop('pvi_no', None)

            account_code_id = detail.pop('account_code', None)
            if account_code_id is None:
                continue

            VoucherDetail.objects.create(
                voucher_master=voucher,
                year=voucher.year,
                vtype=voucher.vtype,
                vno=voucher.vno,
                account_code_id=account_code_id,
                **detail
            )
        return voucher

    def update(self, instance, validated_data):
        validated_data.pop('details', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        details_data = self.initial_data.get('details', None)
        if details_data is not None:
            VoucherDetail.objects.filter(voucher_master=instance).delete()
            for detail in details_data:
                detail.pop('account_title', None)
                detail.pop('pvi_no', None)
                account_code_id = detail.pop('account_code', None)
                if account_code_id is None:
                    continue
                VoucherDetail.objects.create(
                    voucher_master=instance,
                    year=instance.year,
                    vtype=instance.vtype,
                    vno=instance.vno,
                    account_code_id=account_code_id,
                    **detail
                )
        return instance