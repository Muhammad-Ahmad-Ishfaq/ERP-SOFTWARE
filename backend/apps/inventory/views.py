# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import ProtectedError
from .models import Item, Unit
from .serializers import ItemSerializer, UnitSerializer
from apps.purchases.models import PurchaseDetail
from apps.sales.models import SaleDetail
from apps.purchaseOrders.models import PurchaseOrderDetail
from apps.saleOrder.models import SaleOrderDetail


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.filter(STATUS=True)
    serializer_class = UnitSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()  # uses custom manager (active items only)
    serializer_class = ItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(ITEM_NAME__icontains=search)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Override delete: if the item is referenced in any transaction, 
        soft‑delete (set STATUS=False) instead of hard delete.
        If not referenced, hard delete is allowed.
        """
        item = self.get_object()

        # Check for references in all transaction tables
        used_in_purchases = PurchaseDetail.objects.filter(item_code=item).exists()
        used_in_sales = SaleDetail.objects.filter(item_code=item).exists()
        used_in_purchase_orders = PurchaseOrderDetail.objects.filter(item_code=item).exists()
        used_in_sale_orders = SaleOrderDetail.objects.filter(item_code=item).exists()

        if used_in_purchases or used_in_sales or used_in_purchase_orders or used_in_sale_orders:
            # ✅ Soft delete – mark as inactive and return a message
            item.STATUS = False
            item.save()
            return Response(
                {"detail": "Item is used in transactions. It has been deactivated (soft delete)."},
                status=status.HTTP_200_OK
            )
        else:
            # ✅ No references – allow physical deletion
            item.delete()
            return Response(
                {"detail": "Item deleted successfully."},
                status=status.HTTP_204_NO_CONTENT
            )