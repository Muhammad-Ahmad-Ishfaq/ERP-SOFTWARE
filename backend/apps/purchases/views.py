# apps/purchases/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import PurchaseMaster
from .serializers import PurchaseMasterSerializer, PurchaseMasterCreateSerializer

class PurchaseMasterViewSet(viewsets.ModelViewSet):
    queryset = PurchaseMaster.objects.all()
    serializer_class = PurchaseMasterSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PurchaseMasterCreateSerializer
        return PurchaseMasterSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def next_voucher(self, request):
        last = PurchaseMaster.objects.order_by('-vno').first()
        next_no = (last.vno + 1) if last else 1
        return Response({'next_voucher_no': next_no})