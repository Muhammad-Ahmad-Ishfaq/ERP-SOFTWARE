from django.contrib import admin
from .models import PurchaseMaster, PurchaseDetail

class PurchaseDetailInline(admin.TabularInline):
    model = PurchaseDetail
    extra = 1
    fields = ('vsn', 'item_code', 'qty', 'rate', 'amount')
    fk_name = 'purchase_master'  # ✅ use the foreign key field name

@admin.register(PurchaseMaster)
class PurchaseMasterAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vdate', 'account_code', 'purchase_code', 'remarks', 'stts', 'user_no')
    search_fields = ('vtype', 'vno', 'account_code__name', 'purchase_code__name')
    list_filter = ('vtype', 'stts')
    inlines = [PurchaseDetailInline]

@admin.register(PurchaseDetail)
class PurchaseDetailAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vno', 'vsn', 'item_code', 'qty', 'rate', 'amount')
    search_fields = ('vtype', 'vno', 'item_code__item_code')