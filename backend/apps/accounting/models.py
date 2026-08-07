# apps/accounting/models.py
from django.db import models
from apps.users.models import User


class Party(models.Model):
    ACCOUNT_TYPES = [
        ('debtor', 'Debtor'),
        ('creditor', 'Creditor'),
        ('expense', 'Expense'),
        ('inventory', 'Inventory'),
        ('income', 'Income'),
        ('bank', 'Bank'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ]

    code = models.IntegerField()
    sub = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    cell = models.CharField(max_length=20, blank=True, null=True)
    ntn = models.CharField(max_length=10, blank=True, null=True)
    gst_no = models.CharField(max_length=15, blank=True, null=True)

    class Meta:
        db_table = 'parties'
        managed = False
        constraints = [
            models.UniqueConstraint(fields=['code', 'sub'], name='unique_party_code_sub')
        ]

    def __str__(self):
        return f"{self.code}-{self.sub} {self.name}"


class VoucherMaster(models.Model):
    year = models.CharField(max_length=4, db_column='YEAR')
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vdate = models.DateField(db_column='VDATE')
    remarks = models.CharField(max_length=100, blank=True, null=True, db_column='REMARKS')
    status = models.CharField(max_length=1, blank=True, null=True, db_column='STATUS')
    received_by = models.CharField(max_length=25, blank=True, null=True, db_column='RECEIVED_BY')
    user_no = models.IntegerField(db_column='USER_NO')

    class Meta:
        db_table = 'VOUCHER_M'
        constraints = [
            models.UniqueConstraint(fields=['year', 'vtype', 'vno'], name='PK_VM_YRVT_VN')
        ]

    def __str__(self):
        return f"{self.year}-{self.vtype}-{self.vno}"


class VoucherDetail(models.Model):
    year = models.CharField(max_length=4, db_column='YEAR')
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vsn = models.IntegerField(db_column='VSN')
    # ✅ PROTECT prevents deleting a Party that has voucher details
    account_code = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,   # <-- changed from CASCADE
        db_column='ACCOUNT_CODE',
        related_name='voucher_details'
    )
    narration = models.CharField(max_length=100, blank=True, null=True, db_column='NARRATION')
    debit = models.DecimalField(max_digits=15, decimal_places=2, db_column='DEBIT', default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, db_column='CREDIT', default=0)
    branch = models.CharField(max_length=10, blank=True, null=True, db_column='BRANCH')
    cheque_no = models.CharField(max_length=15, blank=True, null=True, db_column='CHEQUE_NO')
    cheque_date = models.DateField(blank=True, null=True, db_column='CHEQUE_DATE')
    chq_title = models.CharField(max_length=50, blank=True, null=True, db_column='CHQ_TITLE')
    due = models.IntegerField(blank=True, null=True, db_column='DUE')

    voucher_master = models.ForeignKey(
        VoucherMaster,
        on_delete=models.CASCADE,
        db_column='voucher_master_id',
        related_name='details',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'VOUCHER_D'
        constraints = [
            models.UniqueConstraint(fields=['year', 'vtype', 'vno', 'vsn'], name='PK_VD_YRVT_VN_VS')
        ]

    def __str__(self):
        return f"{self.year}-{self.vtype}-{self.vno}-{self.vsn}"