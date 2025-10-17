from django.contrib import admin
from .models import Employee, PayrollRecord, LeaveRequest, PerformanceReview

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'hire_date', 'salary', 'status']
    list_filter = ['status']
    search_fields = ['employee_id', 'user__first_name', 'user__last_name']

@admin.register(PayrollRecord)
class PayrollRecordAdmin(admin.ModelAdmin):
    list_display = ['month', 'total_payroll', 'employee_count', 'status', 'processed_date']
    list_filter = ['status']

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'type', 'start_date', 'end_date', 'days', 'status']
    list_filter = ['status', 'type']

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'review_date', 'reviewer', 'rating']
