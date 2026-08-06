# apps/accounting/admin.py
from django.contrib import admin
from .models import Party, VoucherMaster, VoucherDetail

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ('code', 'sub', 'name', 'phone', 'cell')
    search_fields = ('name', 'code', 'sub')

@admin.register(VoucherMaster)
class VoucherMasterAdmin(admin.ModelAdmin):
    list_display = ('year', 'vtype', 'vno', 'vdate', 'user_no', 'status')  # ✅ fixed: use vdate
    search_fields = ('vtype', 'vno')
    list_filter = ('vtype', 'status')

@admin.register(VoucherDetail)
class VoucherDetailAdmin(admin.ModelAdmin):
    list_display = ('year', 'vtype', 'vno', 'vsn', 'account_code', 'debit', 'credit')  # ✅ fixed
    search_fields = ('vtype', 'vno', 'account_code__name')
    list_filter = ('vtype',)