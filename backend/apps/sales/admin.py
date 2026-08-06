# apps/sales/admin.py
from django.contrib import admin
from .models import SaleMaster, SaleDetail

class SaleDetailInline(admin.TabularInline):
    model = SaleDetail
    extra = 1
    fields = ('vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    fk_name = 'sale_master'

@admin.register(SaleMaster)
class SaleMasterAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vdate', 'account_code', 'remarks', 'stts', 'user_no')
    search_fields = ('vtype', 'vno', 'account_code__name')
    list_filter = ('vtype', 'stts')
    inlines = [SaleDetailInline]

@admin.register(SaleDetail)
class SaleDetailAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vsn', 'item_code', 'uom', 'qty', 'rate', 'amount')
    search_fields = ('vtype', 'vno', 'item_code__item_code')