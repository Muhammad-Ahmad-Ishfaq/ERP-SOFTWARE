# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
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
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(ITEM_NAME__icontains=search)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Delete item only if it is NOT referenced in any transaction.
        If referenced, return a clear error message.
        """
        item = self.get_object()

        # Check references
        used_in_purchases = PurchaseDetail.objects.filter(item_code=item).exists()
        used_in_sales = SaleDetail.objects.filter(item_code=item).exists()
        used_in_purchase_orders = PurchaseOrderDetail.objects.filter(item_code=item).exists()
        used_in_sale_orders = SaleOrderDetail.objects.filter(item_code=item).exists()

        if any([used_in_purchases, used_in_sales, used_in_purchase_orders, used_in_sale_orders]):
            references = []
            if used_in_purchases: references.append("Purchases")
            if used_in_sales: references.append("Sales")
            if used_in_purchase_orders: references.append("Purchase Orders")
            if used_in_sale_orders: references.append("Sale Orders")
            error_msg = (
                f"Cannot delete this item because it is referenced in: "
                f"{', '.join(references)}."
            )
            return Response(
                {"error": error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ No soft delete – physically delete the item
        item.delete()
        return Response(
            {'detail': 'Item deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )