# apps/saleOrder/admin.py
from django.contrib import admin
from .models import SaleOrderMaster, SaleOrderDetail

class SaleOrderDetailInline(admin.TabularInline):
    model = SaleOrderDetail
    extra = 1
    fields = ('vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    fk_name = 'sale_order_master'

@admin.register(SaleOrderMaster)
class SaleOrderMasterAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vdate', 'customer', 'remarks', 'stts', 'user_no')
    search_fields = ('vtype', 'vno', 'customer__name')
    list_filter = ('vtype', 'stts')
    inlines = [SaleOrderDetailInline]

@admin.register(SaleOrderDetail)
class SaleOrderDetailAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    search_fields = ('vtype', 'vno', 'item_code__item_code')