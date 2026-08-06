# apps/saleOrder/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import SaleOrderMaster
from .serializers import (
    SaleOrderMasterSerializer,
    SaleOrderMasterCreateSerializer
)

class SaleOrderMasterViewSet(viewsets.ModelViewSet):
    queryset = SaleOrderMaster.objects.all()
    serializer_class = SaleOrderMasterSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SaleOrderMasterCreateSerializer
        return SaleOrderMasterSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ SO validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def next_voucher(self, request):
        last = SaleOrderMaster.objects.order_by('-vno').first()
        next_no = (last.vno + 1) if last else 1
        return Response({'next_voucher_no': next_no})