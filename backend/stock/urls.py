from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (MaterialViewSet, EquipmentViewSet, 
                    StockTransactionViewSet, WarehouseViewSet)

router = DefaultRouter()
router.register(r'materials', MaterialViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'transactions', StockTransactionViewSet)
router.register(r'warehouses', WarehouseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
