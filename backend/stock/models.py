from django.db import models
from projects.models import Project

class Material(models.Model):
    STATUS_CHOICES = [
        ('in-stock', 'In Stock'),
        ('low-stock', 'Low Stock'),
        ('out-of-stock', 'Out of Stock'),
    ]
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50)
    min_stock = models.IntegerField()
    max_stock = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=100)
    supplier = models.CharField(max_length=200)
    last_restocked = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in-stock')
    
    @property
    def total_value(self):
        return self.quantity * self.unit_price
    
    def calculate_status(self):
        """Calculate material status based on quantity and stock levels"""
        if self.quantity <= 0:
            return 'out-of-stock'
        elif self.quantity <= self.min_stock:
            return 'low-stock'
        else:
            return 'in-stock'
    
    def update_quantity(self, transaction_type, quantity):
        """Update material quantity based on transaction type"""
        if transaction_type == 'in':
            self.quantity += quantity
        elif transaction_type == 'out':
            self.quantity -= quantity
            if self.quantity < 0:
                self.quantity = 0
        
        # Update status based on new quantity
        self.status = self.calculate_status()
        
        # Update last_restocked if it's an incoming transaction
        if transaction_type == 'in':
            from django.utils import timezone
            self.last_restocked = timezone.now().date()
        
        self.save()
    
    def __str__(self):
        return self.name

class Equipment(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in-use', 'In Use'),
        ('maintenance', 'Maintenance'),
    ]
    
    CONDITION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
    ]
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    location = models.CharField(max_length=100)
    assigned_to = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='equipment')
    purchase_date = models.DateField()
    last_maintenance = models.DateField()
    next_maintenance = models.DateField()
    value = models.DecimalField(max_digits=12, decimal_places=2)
    
    def __str__(self):
        return self.name

class StockTransaction(models.Model):
    TYPE_CHOICES = [
        ('in', 'In'),
        ('out', 'Out'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='transactions')
    quantity = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(max_length=100)
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        """Override save to automatically update material quantity and status"""
        is_new = self.pk is None
        
        # Call the original save method first
        super().save(*args, **kwargs)
        
        # Update material quantity and status
        if is_new and self.type in ['in', 'out']:
            self.material.update_quantity(self.type, self.quantity)
    
    def __str__(self):
        return f"{self.type} - {self.material.name} - {self.quantity}"

class Warehouse(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    capacity = models.IntegerField()
    occupied = models.IntegerField(default=0)
    manager = models.CharField(max_length=100)
    categories = models.JSONField(default=list)
    
    def __str__(self):
        return self.name
