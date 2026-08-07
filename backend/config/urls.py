from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "message": "ERP Software API is running",
        "status": "success",
        "version": "1.0"
    })


urlpatterns = [
    path('', home),

    path('admin/', admin.site.urls),

    path('api/users/', include('apps.users.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/accounting/', include('apps.accounting.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/vtypes/', include('apps.vtypes.urls')),
    path('api/ac_setup/', include('apps.ac_setup.urls')),
    path('api/locations/', include('apps.locations.urls')),
    path('api/purchases/', include('apps.purchases.urls')),
    path('api/purchase-orders/', include('apps.purchaseOrders.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/sale-orders/', include('apps.saleOrder.urls')),
]