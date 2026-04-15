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

class OperationRequest(models.Model):
    """Demande d'opération financière avec workflow"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('submitted', 'Soumis'),
        ('validated', 'Validé'),
        ('paid', 'Payé'),
        ('rejected', 'Rejeté'),
    ]
    
    PERIOD_CHOICES = [
        ('daily', 'Quotidien'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel'),
        ('yearly', 'Annuel'),
        ('one_time', 'Ponctuel'),
    ]
    
    # Champs auto-générés
    reference = models.CharField(max_length=50, unique=True, editable=False)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='operation_requests')
    
    # Champs obligatoires
    task_name = models.CharField(max_length=200, verbose_name="Nom de Tâche")
    requester = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='requested_operations')
    request_date = models.DateField(auto_now_add=True, verbose_name="Date de demande")
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, verbose_name="Période")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant total demandé")
    description = models.TextField(verbose_name="Motif / description")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Champs supplémentaires
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_operations')
    validation_date = models.DateField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, verbose_name="Raison du rejet")
    payment_proof = models.FileField(upload_to='payment_proofs/%Y/%m/%d/', null=True, blank=True, verbose_name="Justificatif de paiement")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Demande d'opération"
        verbose_name_plural = "Demandes d'opération"
        ordering = ['-request_date']
    
    def __str__(self):
        return f"{self.reference} - {self.task_name}"
    
    def save(self, *args, **kwargs):
        """Override save pour générer la référence automatiquement"""
        if not self.reference:
            # Générer une référence unique: OP-YYYYMMDD-XXXX
            from django.utils import timezone
            import random
            date_str = timezone.now().strftime('%Y%m%d')
            random_num = random.randint(1000, 9999)
            self.reference = f"OP-{date_str}-{random_num}"
        
        # Validation des transitions de statut
        if self.status == 'validated' and not self.validated_by:
            # Ne peut pas être validé sans validateur
            self.status = 'submitted'
        
        if self.status == 'validated' and not self.validation_date:
            from django.utils import timezone
            self.validation_date = timezone.now().date()
        
        super().save(*args, **kwargs)
    
    @property
    def is_validated(self):
        """Vérifie si la demande est validée"""
        return self.status == 'validated'
    
    @property
    def is_rejected(self):
        """Vérifie si la demande est rejetée"""
        return self.status == 'rejected'
    
    @property
    def can_be_submitted(self):
        """Vérifie si la demande peut être soumise"""
        return self.status == 'draft'
    
    @property
    def can_be_validated(self):
        """Vérifie si la demande peut être validée"""
        return self.status == 'submitted'
    
    @property
    def can_be_rejected(self):
        """Vérifie si la demande peut être rejetée"""
        return self.status in ['draft', 'submitted']
    
    def validate_budget_availability(self):
        """Valide si le budget du projet permet cette opération"""
        if not self.project:
            return True, "Aucun projet associé"
        
        # Calculer le budget restant du projet
        project_budget = self.project.budget
        project_spent = self.project.spent
        
        remaining_budget = project_budget - project_spent
        
        if self.total_amount > remaining_budget:
            return False, f"Budget insuffisant. Restant: {remaining_budget}, Opération: {self.total_amount}"
        
        return True, f"Budget suffisant. Restant: {remaining_budget}"
    
    def get_workflow_status(self):
        """Retourne le statut du workflow"""
        workflow = {
            'draft': 'Brouillon - En cours de saisie',
            'submitted': 'Soumis - En attente de validation',
            'validated': 'Validé - Opération approuvée',
            'rejected': 'Rejeté - Opération refusée'
        }
        return workflow.get(self.status, self.status)
