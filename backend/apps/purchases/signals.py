# # apps/purchases/signals.py
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.db import transaction
# from django.db import models  # ADD THIS
# from .models import PurchaseMaster
# from apps.accounting.models import VoucherMaster, VoucherDetail
# from django.contrib.auth import get_user_model

# User = get_user_model()

# @receiver(post_save, sender=PurchaseMaster)
# def create_voucher_on_purchase_completion(sender, instance, created, **kwargs):
#     if instance.stts != 'C' or instance.voucher_created:
#         return

#     total_amount = instance.details.aggregate(
#         total=models.Sum('amount')
#     )['total'] or 0

#     supplier = instance.account_code
#     purchase_account = instance.purchase_code

#     if not supplier or not purchase_account:
#         import logging
#         logging.warning(f"Purchase #{instance.vno} missing supplier or purchase account")
#         return

#     with transaction.atomic():
#         voucher = VoucherMaster.objects.create(
#             vtype='PV',
#             vno=instance.vno,
#             date=instance.vdate,
#             user_no=instance.user_no.USER_ID if instance.user_no else None,
#             remarks=instance.remarks or f"Auto-generated from Purchase #{instance.vno}"
#         )

#         # Debit entry: use purchase_account.sub (string) directly
#         VoucherDetail.objects.create(
#             vtype=voucher.vtype,
#             vno=voucher.vno,
#             code=purchase_account.code,
#             sub=purchase_account.sub,  # now it's a string, and VoucherDetail.sub is CharField
#             name=purchase_account.name,
#             debit=total_amount - float(instance.discount or 0),
#             credit=0,
#             descrip=f"Purchase of goods via PO #{instance.vno}"
#         )

#         # Credit entry: use supplier.sub (string)
#         VoucherDetail.objects.create(
#             vtype=voucher.vtype,
#             vno=voucher.vno,
#             code=supplier.code,
#             sub=supplier.sub,
#             name=supplier.name,
#             debit=0,
#             credit=total_amount - float(instance.discount or 0),
#             descrip=f"Supplier credit for purchase #{instance.vno}"
#         )

#         instance.voucher_created = True
#         instance.save(update_fields=['voucher_created'])