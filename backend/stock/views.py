from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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

    @action(detail=False, methods=['post'])
    def recalculate_statuses(self, request):
        """Recalculate status for all materials based on current quantities"""
        materials = Material.objects.all()
        updated_count = 0
        
        for material in materials:
            old_status = material.status
            new_status = material.calculate_status()
            
            if old_status != new_status:
                material.status = new_status
                material.save()
                updated_count += 1
        
        return Response({
            'message': f'Status recalculated for {updated_count} materials',
            'updated_count': updated_count,
            'total_materials': materials.count()
        })

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

    def create(self, request, *args, **kwargs):
        """Override create to handle material lookup by name"""
        data = request.data.copy()
        
        # Handle material lookup by name
        if 'material_name' in data:
            try:
                material = Material.objects.get(name=data['material_name'])
                data['material'] = material.id
                del data['material_name']
            except Material.DoesNotExist:
                return Response(
                    {'error': f"Material with name '{data['material_name']}' not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location']
