from rest_framework import serializers
from .models import Material, Equipment, StockTransaction, Warehouse

class MaterialSerializer(serializers.ModelSerializer):
    total_value = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Material
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    assigned_project = serializers.CharField(source='assigned_to.name', read_only=True)
    
    class Meta:
        model = Equipment
        fields = '__all__'

class StockTransactionSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = StockTransaction
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
