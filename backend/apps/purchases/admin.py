# apps/purchases/admin.py
from django.contrib import admin
from .models import PurchaseMaster, PurchaseDetail

@admin.register(PurchaseMaster)
class PurchaseMasterAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vdate', 'account_code', 'stts')
    search_fields = ('vtype', 'vno')

@admin.register(PurchaseDetail)
class PurchaseDetailAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vsn', 'item_code', 'qty', 'rate', 'amount')