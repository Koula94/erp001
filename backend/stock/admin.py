from django.contrib import admin
from .models import Material, Equipment, StockTransaction, Warehouse

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'quantity', 'unit', 'status', 'location']
    list_filter = ['status', 'category']
    search_fields = ['name']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'status', 'condition', 'location', 'assigned_to']
    list_filter = ['status', 'condition', 'category']

@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ['material', 'type', 'quantity', 'date', 'reference']
    list_filter = ['type']

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'capacity', 'occupied', 'manager']
