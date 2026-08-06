# apps/purchases/voucher_helpers.py
from django.db import transaction
from apps.accounting.models import VoucherMaster, VoucherDetail

def create_voucher_for_purchase(purchase):
    """
    Creates voucher entries for a completed purchase.
    Returns True if successful, False if conditions not met.
    """
    # Skip if already created or not completed
    if purchase.stts != 'C' or purchase.voucher_created:
        return False

    total_amount = purchase.details.aggregate(
        total=models.Sum('amount')
    )['total'] or 0

    supplier = purchase.account_code
    purchase_account = purchase.purchase_code

    if not supplier or not purchase_account:
        # log error
        return False

    with transaction.atomic():
        voucher = VoucherMaster.objects.create(
            vtype='PV',
            vno=purchase.vno,
            date=purchase.vdate,
            user_no=purchase.user_no.USER_ID if purchase.user_no else None,
            remarks=purchase.remarks or f"Auto-generated from Purchase #{purchase.vno}"
        )

        VoucherDetail.objects.create(
            vtype=voucher.vtype,
            vno=voucher.vno,
            code=purchase_account.code,
            sub=purchase_account.sub,
            name=purchase_account.name,
            debit=total_amount - float(purchase.discount or 0),
            credit=0,
            descrip=f"Purchase of goods via PO #{purchase.vno}"
        )

        VoucherDetail.objects.create(
            vtype=voucher.vtype,
            vno=voucher.vno,
            code=supplier.code,
            sub=supplier.sub,
            name=supplier.name,
            debit=0,
            credit=total_amount - float(purchase.discount or 0),
            descrip=f"Supplier credit for purchase #{purchase.vno}"
        )

        purchase.voucher_created = True
        purchase.save(update_fields=['voucher_created'])

    return True