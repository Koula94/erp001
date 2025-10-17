from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee, PayrollRecord, LeaveRequest, PerformanceReview
from .serializers import (EmployeeSerializer, PayrollRecordSerializer, 
                          LeaveRequestSerializer, PerformanceReviewSerializer)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().select_related('user')
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['employee_id', 'user__first_name', 'user__last_name']
    filterset_fields = ['status']
    ordering_fields = ['hire_date', 'salary']

class PayrollRecordViewSet(viewsets.ModelViewSet):
    queryset = PayrollRecord.objects.all()
    serializer_class = PayrollRecordSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['status']
    ordering_fields = ['created_at']

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().select_related('employee__user')
    serializer_class = LeaveRequestSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'type', 'employee']
    ordering_fields = ['created_at', 'start_date']

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all().select_related('employee__user', 'reviewer')
    serializer_class = PerformanceReviewSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['employee']
    ordering_fields = ['review_date']
