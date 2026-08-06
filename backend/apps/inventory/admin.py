from django.contrib import admin
from .models import Unit, Item

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['UOM_ID', 'UOM_NAME', 'SHORT_NAME', 'STATUS']
    list_filter = ['STATUS']
    search_fields = ['UOM_NAME', 'SHORT_NAME']
    ordering = ['UOM_NAME']

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['ITEM_ID', 'ITEM_CODE', 'ITEM_NAME', 'UOM', 'COST_PRICE', 'STATUS']
    list_filter = ['STATUS', 'UOM']
    search_fields = ['ITEM_CODE', 'ITEM_NAME']
    readonly_fields = ['ITEM_CODE', 'CREATED_AT', 'UPDATED_AT']
    ordering = ['ITEM_NAME']