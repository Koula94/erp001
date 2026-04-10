from django.db import models
from crm.models import Client
from projects.models import Project
from users.models import User

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    invoice_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.invoice_number

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)

class Expense(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('submitted', 'Soumis'),
        ('under_review', 'En révision'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('paid', 'Payé'),
    ]
    
    CATEGORY_CHOICES = [
        ('materials', 'Matériaux'),
        ('labor', 'Main d\'œuvre'),
        ('equipment', 'Équipement'),
        ('transport', 'Transport'),
        ('utilities', 'Services'),
        ('consulting', 'Consulting'),
        ('software', 'Logiciels'),
        ('other', 'Autre'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyenne'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='submitted_expenses')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='paid_expenses')
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Notes internes pour le traitement")
    payment_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.category} - {self.amount}"
    
    @property
    def is_approved(self):
        """Vérifie si la dépense est approuvée"""
        return self.status in ['approved', 'paid']
    
    @property
    def is_paid(self):
        """Vérifie si la dépense est payée"""
        return self.status == 'paid'
    
    @property
    def days_since_submission(self):
        """Retourne le nombre de jours depuis la soumission"""
        if self.status != 'draft':
            from django.utils import timezone
            return (timezone.now().date() - self.date).days
        return 0
    
    def can_be_approved(self):
        """Vérifie si la dépense peut être approuvée"""
        return self.status in ['submitted', 'under_review']
    
    def can_be_paid(self):
        """Vérifie si la dépense peut être payée"""
        return self.status == 'approved'
    
    def get_workflow_status(self):
        """Retourne le statut du workflow"""
        workflow = {
            'draft': 'Brouillon',
            'submitted': 'Soumis pour approbation',
            'under_review': 'En cours de révision',
            'approved': 'Approuvé - En attente de paiement',
            'rejected': 'Rejeté',
            'paid': 'Payé'
        }
        return workflow.get(self.status, self.status)
    
    def validate_budget_availability(self):
        """Valide si le budget du projet permet cette dépense"""
        if not self.project:
            return True, "Aucun projet associé"
        
        # Calculer le budget restant du projet
        project_budget = self.project.budget
        project_spent = self.project.spent
        
        remaining_budget = project_budget - project_spent
        
        if self.amount > remaining_budget:
            return False, f"Budget insuffisant. Restant: {remaining_budget}, Dépense: {self.amount}"
        
        return True, f"Budget suffisant. Restant: {remaining_budget}"
    
    def save(self, *args, **kwargs):
        """Override save pour gérer les transitions de statut"""
        # Logique de validation avant sauvegarde
        if self.status == 'approved' and not self.approved_by:
            # Ne peut pas être approuvé sans approbateur
            self.status = 'under_review'
        
        if self.status == 'paid' and not self.payment_date:
            from django.utils import timezone
            self.payment_date = timezone.now().date()
        
        super().save(*args, **kwargs)

class Budget(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='budgets', null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100)
    planned_amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    
    @property
    def remaining(self):
        return self.planned_amount - self.spent_amount
    
    def __str__(self):
        return f"{self.category} - {self.period_start} to {self.period_end}"
