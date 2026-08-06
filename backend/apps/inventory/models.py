# apps/inventory/models.py
from django.db import models
from django.conf import settings


# ===========================
# Unit of Measurement Model
# ===========================
class Unit(models.Model):
    UOM_ID = models.BigAutoField(primary_key=True)
    UOM_NAME = models.CharField(max_length=50, unique=True)
    SHORT_NAME = models.CharField(max_length=20, unique=True)
    STATUS = models.BooleanField(default=True)
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    UPDATED_AT = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "units"
        ordering = ["UOM_NAME"]

    def __str__(self):
        return self.SHORT_NAME


# ===========================
# Item Model
# ===========================
class Item(models.Model):
    ITEM_ID = models.BigAutoField(primary_key=True)
    ITEM_CODE = models.CharField(max_length=20, unique=True, editable=False)
    ITEM_NAME = models.CharField(max_length=200, unique=True)
    ITEM_DESCRIPTION = models.TextField(blank=True, null=True)
    
    UOM = models.ForeignKey(
        Unit,
        on_delete=models.PROTECT,
        related_name="items"
    )
    
    COST_PRICE = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    MIN_STOCK = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    MAX_STOCK = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    REORDER_LEVEL = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    MORE_DETAIL = models.TextField(blank=True, null=True)
    STATUS = models.BooleanField(default=True)
    
    # ✅ Make CREATED_BY optional so API can set it automatically
    CREATED_BY = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="items_created",
        null=True,  # ✅ Allow null for API requests
        blank=True  # ✅ Allow blank for API requests
    )
    
    UPDATED_BY = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="items_updated",
        blank=True,
        null=True
    )
    
    CREATED_AT = models.DateTimeField(auto_now_add=True)
    UPDATED_AT = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "items"
        ordering = ["ITEM_NAME"]

    def save(self, *args, **kwargs):
        if not self.ITEM_CODE:
            last = Item.objects.order_by("-ITEM_ID").first()
            if last:
                number = last.ITEM_ID + 1
            else:
                number = 1
            self.ITEM_CODE = f"ITM-{number:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ITEM_CODE} - {self.ITEM_NAME}"