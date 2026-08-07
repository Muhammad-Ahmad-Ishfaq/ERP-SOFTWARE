# apps/sales/models.py
from django.db import models
from apps.users.models import User
from apps.accounting.models import Party
from apps.inventory.models import Item, Unit
from apps.locations.models import Location


class SaleMaster(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vdate = models.DateField(db_column='VDATE')
    dc_no = models.CharField(max_length=10, db_column='DC_NO', blank=True, null=True)
    account_code = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,
        db_column='ACCOUNT_CODE',
        related_name='sale_accounts',
        limit_choices_to={'sub': 'debtor'},
        null=True,
        blank=True
    )
    sale_code = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,
        db_column='SALE_CODE',
        related_name='sale_codes',
        null=True,
        blank=True
    )
    remarks = models.CharField(max_length=100, db_column='REMARKS', blank=True, null=True)
    discount = models.DecimalField(max_digits=10, decimal_places=2, db_column='DISCOUNT', default=0)
    stts = models.CharField(max_length=1, db_column='STTS', default='A')
    user_no = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='USER_NO',
        related_name='sales'
    )
    voucher_created = models.BooleanField(default=False)

    class Meta:
        db_table = 'INV_M'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno'], name='PK_VTYPNO_SALEM')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}"


class SaleDetail(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vsn = models.IntegerField(db_column='VSN')
    item_code = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        db_column='ITEM_CODE',
        related_name='sale_details',
        null=True,
        blank=True
    )
    uom = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='UOM_ID',
        related_name='sale_details'
    )
    qty = models.DecimalField(max_digits=11, decimal_places=3, db_column='QTY', default=0)
    rate = models.DecimalField(max_digits=13, decimal_places=4, db_column='RATE', default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2, db_column='AMOUNT', default=0)
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='LOCATION_ID',
        related_name='sale_details'
    )
    sale_master = models.ForeignKey(
        SaleMaster,
        on_delete=models.CASCADE,
        db_column='sale_master_id',
        related_name='details',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'INV_D'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno', 'vsn'], name='PK_VTYPNOSN_SALED')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}-{self.vsn}"