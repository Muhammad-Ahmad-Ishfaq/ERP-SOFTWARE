from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Max
from .models import VoucherMaster, Party
from .serializers import VoucherMasterSerializer, PartySerializer


class PartyViewSet(viewsets.ModelViewSet):
    queryset = Party.objects.all()
    serializer_class = PartySerializer


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = VoucherMaster.objects.prefetch_related('details')
    serializer_class = VoucherMasterSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        year = self.request.query_params.get('year')
        vtype = self.request.query_params.get('vtype')
        if year:
            queryset = queryset.filter(year=year)
        if vtype:
            queryset = queryset.filter(vtype=vtype)
        return queryset

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        year = request.query_params.get('year')
        vtype = request.query_params.get('vtype')
        if not year or not vtype:
            return Response({'error': 'year and vtype are required'}, status=status.HTTP_400_BAD_REQUEST)
        last = VoucherMaster.objects.filter(year=year, vtype=vtype).aggregate(Max('vno'))['vno__max'] or 0
        return Response({'vno': last + 1})