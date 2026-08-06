# apps/saleOrder/models.py
from django.db import models
from apps.users.models import User
from apps.accounting.models import Party
from apps.inventory.models import Item, Unit

class SaleOrderMaster(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vdate = models.DateField(db_column='VDATE')
    customer = models.ForeignKey(
        Party,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='CUSTOMER_ID',
        related_name='sale_orders',
        limit_choices_to={'sub': 'debtor'}
    )
    remarks = models.CharField(max_length=100, db_column='REMARKS', blank=True, null=True)
    stts = models.CharField(max_length=1, db_column='STTS', default='P')
    user_no = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='USER_NO',
        related_name='sale_orders'
    )

    class Meta:
        db_table = 'SO_M'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno'], name='PK_VTYPNO_SOM')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}"


class SaleOrderDetail(models.Model):
    vtype = models.CharField(max_length=5, db_column='VTYPE')
    vno = models.IntegerField(db_column='VNO')
    vsn = models.IntegerField(db_column='VSN')
    item_code = models.ForeignKey(
        Item,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='ITEM_CODE',
        related_name='sale_order_details'
    )
    uom = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='UOM_ID',
        related_name='sale_order_details'
    )
    qty = models.DecimalField(max_digits=11, decimal_places=3, db_column='QTY', default=0)
    rate = models.DecimalField(max_digits=13, decimal_places=4, db_column='RATE', default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2, db_column='AMOUNT', default=0)
    sale_order_master = models.ForeignKey(
        SaleOrderMaster,
        on_delete=models.CASCADE,
        db_column='sale_order_master_id',
        related_name='details',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'SO_D'
        constraints = [
            models.UniqueConstraint(fields=['vtype', 'vno', 'vsn'], name='PK_VTYPNOSN_SOD')
        ]

    def __str__(self):
        return f"{self.vtype}-{self.vno}-{self.vsn}"