# apps/purchases/models.py
from django.db import models
from apps.users.models import User
from apps.accounting.models import Party
from apps.inventory.models import Item, Unit
from apps.locations.models import Location


class PurchaseMaster(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vdate = models.DateField(db_column='VDATE')
    dc_no = models.CharField(max_length=10, db_column='DC_NO', blank=True, null=True)
    # ✅ Keep nullable but PROTECT when set
    account_code = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,
        db_column='ACCOUNT_CODE',
        related_name='purchase_accounts',
        null=True,
        blank=True
    )
    purchase_code = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,
        db_column='PURCHASE_CODE',
        related_name='purchase_codes',
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
        related_name='purchases'
    )
    voucher_created = models.BooleanField(default=False)

    class Meta:
        db_table = 'PUR_M'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno'], name='PK_VTYPNO_PURM')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}"


class PurchaseDetail(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vsn = models.IntegerField(db_column='VSN')
    item_code = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        db_column='ITEM_CODE',
        related_name='purchase_details',
        null=True,
        blank=True
    )
    uom = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='UOM_ID',
        related_name='purchase_details'
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
        related_name='purchase_details'
    )

    # ─── Weight fields ────────────────────────────────────────────────────
    weight_per_unit = models.DecimalField(
        max_digits=10, decimal_places=3,
        default=0,
        help_text="Weight per unit (kg) – taken from item at purchase time"
    )
    weight_kg = models.DecimalField(
        max_digits=15, decimal_places=3,
        default=0,
        help_text="Total weight in kg (qty × weight_per_unit)"
    )
    weight_lbs = models.DecimalField(
        max_digits=15, decimal_places=3,
        default=0,
        help_text="Total weight in lbs (weight_kg × 2.2040)"
    )

    purchase_master = models.ForeignKey(
        PurchaseMaster,
        on_delete=models.CASCADE,
        db_column='purchase_master_id',
        related_name='details',
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'PUR_D'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno', 'vsn'], name='PK_VTYPNOSN_PURD')
        ]

    def save(self, *args, **kwargs):
        # Auto‑calculate weight_kg and weight_lbs if qty and weight_per_unit are set
        if self.qty and self.weight_per_unit:
            self.weight_kg = self.qty * self.weight_per_unit
            self.weight_lbs = self.weight_kg * Decimal('2.2040')
        else:
            self.weight_kg = 0
            self.weight_lbs = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vtype}-{self.vno}-{self.vsn}"