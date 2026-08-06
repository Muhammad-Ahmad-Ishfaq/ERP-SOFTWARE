from django.apps import AppConfig

class VtypesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.vtypes'   # <-- must be 'apps.vtypes', not 'vtypes'