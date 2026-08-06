# apps/purchases/apps.py
from django.apps import AppConfig

class PurchasesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.purchases'

    def ready(self):
        # import apps.purchases.signals  # ❌ Disabled
        pass