from django.contrib import admin
from .models import ACSetup

@admin.register(ACSetup)
class ACSetupAdmin(admin.ModelAdmin):
    list_display = ('id', 'purchase_code', 'debtor_code', 'creditor_code')