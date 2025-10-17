from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (EmployeeViewSet, PayrollRecordViewSet, 
                    LeaveRequestViewSet, PerformanceReviewViewSet)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'payroll', PayrollRecordViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
router.register(r'performance-reviews', PerformanceReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
