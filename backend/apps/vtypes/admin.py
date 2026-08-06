from django.contrib import admin
from .models import VType

@admin.register(VType)
class VTypeAdmin(admin.ModelAdmin):
    list_display = ('vtype', 'vtype_description')
    search_fields = ('vtype', 'vtype_description')