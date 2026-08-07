# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Item, Unit
from .serializers import ItemSerializer, UnitSerializer


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.filter(STATUS=True)
    serializer_class = UnitSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()  # uses ItemManager → only active
    serializer_class = ItemSerializer

    def get_queryset(self):
        # Allow searching/filtering
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(ITEM_NAME__icontains=search)
        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete: set STATUS=False instead of physically deleting.
        """
        item = self.get_object()
        item.STATUS = False
        item.save()
        return Response(
            {'detail': 'Item deactivated successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )