from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, ExpenseViewSet, BudgetViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'budgets', BudgetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
