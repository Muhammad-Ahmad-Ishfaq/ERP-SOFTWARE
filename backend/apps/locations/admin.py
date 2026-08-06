from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Location

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'description', 'is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    list_filter = ('is_active',)
    ordering = ('code',)