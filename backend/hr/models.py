from django.db import models
from users.models import User

class Employee(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on-leave', 'On Leave'),
        ('inactive', 'Inactive'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    skills = models.JSONField(default=list)
    performance_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    
    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"

class PayrollRecord(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
    ]
    
    month = models.CharField(max_length=50)
    total_payroll = models.DecimalField(max_digits=12, decimal_places=2)
    employee_count = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payroll {self.month}"

class LeaveRequest(models.Model):
    TYPE_CHOICES = [
        ('vacation', 'Vacation'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.type}"

class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    review_date = models.DateField()
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    strengths = models.TextField()
    improvements = models.TextField()
    goals = models.TextField()
    
    def __str__(self):
        return f"{self.employee.user.get_full_name()} - {self.review_date}"
