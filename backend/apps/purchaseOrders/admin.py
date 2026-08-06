from django.contrib import admin
from .models import PurchaseOrderMaster, PurchaseOrderDetail

class PurchaseOrderDetailInline(admin.TabularInline):
    model = PurchaseOrderDetail
    extra = 1
    fields = ('vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    fk_name = 'purchase_order_master'

@admin.register(PurchaseOrderMaster)
class PurchaseOrderMasterAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vdate', 'supplier', 'remarks', 'stts', 'user_no')
    search_fields = ('vtype', 'vno', 'supplier__name')
    list_filter = ('vtype', 'stts')
    inlines = [PurchaseOrderDetailInline]

@admin.register(PurchaseOrderDetail)
class PurchaseOrderDetailAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    search_fields = ('vtype', 'vno', 'item_code__item_code')