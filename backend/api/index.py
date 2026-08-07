import os
import sys
from pathlib import Path

print("=== VERCEL DJANGO START ===")

BASE_DIR = Path(__file__).resolve().parent.parent

print("BASE DIR:", BASE_DIR)

sys.path.insert(0, str(BASE_DIR))

print("PYTHON PATH:", sys.path)

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings"
)

print("Loading Django settings...")

try:
    from django.core.wsgi import get_wsgi_application

    print("Creating Django application...")

    app = get_wsgi_application()

    print("=== DJANGO SUCCESS ===")

except Exception as e:
    print("=== DJANGO ERROR ===")
    print(type(e).__name__)
    print(str(e))
    raise