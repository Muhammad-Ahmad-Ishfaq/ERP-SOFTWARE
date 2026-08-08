# apps/purchaseOrders/models.py
from django.db import models
from decimal import Decimal
from apps.users.models import User
from apps.accounting.models import Party
from apps.inventory.models import Item, Unit


class PurchaseOrderMaster(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vdate = models.DateField(db_column='VDATE')
    supplier = models.ForeignKey(
        Party,
        on_delete=models.PROTECT,
        db_column='SUPPLIER_ID',
        related_name='purchase_orders',
        limit_choices_to={'sub': 'creditor'},
        null=True,
        blank=True
    )
    remarks = models.CharField(max_length=100, db_column='REMARKS', blank=True, null=True)
    stts = models.CharField(max_length=1, db_column='STTS', default='A')
    user_no = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='USER_NO',
        related_name='purchase_orders'
    )

    class Meta:
        db_table = 'PO_M'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno'], name='PK_VTYPNO_POM')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}"


class PurchaseOrderDetail(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vsn = models.IntegerField(db_column='VSN')
    qty = models.DecimalField(max_digits=11, decimal_places=3, db_column='QTY')
    rate = models.DecimalField(max_digits=13, decimal_places=4, db_column='RATE')
    amount = models.DecimalField(max_digits=10, decimal_places=2, db_column='AMOUNT')

    item_code = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        db_column='ITEM_CODE',
        related_name='purchase_order_details',
        null=True,
        blank=True
    )
    uom = models.ForeignKey(
        Unit,
        on_delete=models.PROTECT,
        db_column='UOM_ID',
        related_name='purchase_order_details',
        null=True,
        blank=True
    )

    # ─── Weight fields (no weight_per_unit) ──────────────────────────────
    weight_kg = models.DecimalField(
        max_digits=15, decimal_places=3,
        default=0,
        help_text="Total weight in kg (entered by user)"
    )
    weight_lbs = models.DecimalField(
        max_digits=15, decimal_places=3,
        default=0,
        help_text="Total weight in lbs (auto‑calculated: kg × 2.2046)"
    )

    purchase_order_master = models.ForeignKey(
        PurchaseOrderMaster,
        on_delete=models.CASCADE,
        db_column='purchase_order_master_id',
        related_name='details'
    )

    class Meta:
        db_table = 'PO_D'
        constraints = [
            models.UniqueConstraint(
                fields=['vtype', 'vno', 'vsn'],
                name='PK_VTYPNOSN_POD'
            )
        ]

    def save(self, *args, **kwargs):
        # Auto‑calculate weight_lbs from weight_kg
        if self.weight_kg:
            self.weight_lbs = self.weight_kg * Decimal('2.2046')
        else:
            self.weight_lbs = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vtype}-{self.vno}-{self.vsn}"