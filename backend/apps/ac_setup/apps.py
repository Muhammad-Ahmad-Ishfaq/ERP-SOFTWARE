from django.apps import AppConfig

class AcSetupConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ac_setup'   # ✅ must be 'apps.ac_setup'