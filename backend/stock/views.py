from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material, Equipment, StockTransaction, Warehouse
from .serializers import (MaterialSerializer, EquipmentSerializer, 
                          StockTransactionSerializer, WarehouseSerializer)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'category']
    filterset_fields = ['status', 'category', 'location']
    ordering_fields = ['name', 'quantity']

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all().select_related('assigned_to')
    serializer_class = EquipmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'category']
    filterset_fields = ['status', 'condition', 'category']
    ordering_fields = ['name', 'purchase_date']

class StockTransactionViewSet(viewsets.ModelViewSet):
    queryset = StockTransaction.objects.all().select_related('material')
    serializer_class = StockTransactionSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['type', 'material']
    ordering_fields = ['date']

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location']
