"""
Signaux automatiques pour le workflow des dépenses
Déclenchement automatique des actions lors des modifications
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Expense, Invoice
from .workflow import ExpenseWorkflow
from projects.models import Project

@receiver(pre_save, sender=Expense)
def validate_expense_before_save(sender, instance, **kwargs):
    """Validation automatique avant sauvegarde d'une dépense"""
    if instance.pk:  # Mise à jour d'une dépense existante
        try:
            original = Expense.objects.get(pk=instance.pk)
            
            # Si le montant change, valider le budget
            if original.amount != instance.amount and instance.project:
                workflow = ExpenseWorkflow(instance)
                budget_check = workflow._validate_budget(instance.amount)
                
                if not budget_check['valid']:
                    raise ValueError(f"Validation budget échouée: {budget_check['message']}")
        
        except Expense.DoesNotExist:
            pass

@receiver(post_save, sender=Expense)
def handle_expense_status_change(sender, instance, created, **kwargs):
    """Gestion automatique des changements de statut des dépenses"""
    if created:
        # Nouvelle dépense créée
        _handle_new_expense(instance)
    else:
        # Dépense mise à jour
        _handle_expense_update(instance)

@receiver(post_save, sender=Invoice)
def handle_invoice_payment(sender, instance, created, **kwargs):
    """Gestion automatique du paiement des factures"""
    if not created and instance.status == 'paid' and instance.project:
        # Mise à jour du budget projet lors du paiement d'une facture
        _update_project_budget_from_invoice(instance.project)

def _handle_new_expense(expense):
    """Traitement d'une nouvelle dépense"""
    print(f"📝 Nouvelle dépense créée: {expense.description} (${expense.amount})")
    
    # Notification automatique si dépense importante
    if expense.amount > 1000 and expense.project:
        _send_high_amount_notification(expense)

def _handle_expense_update(expense):
    """Traitement de la mise à jour d'une dépense"""
    try:
        original = Expense.objects.get(pk=expense.pk)
        
        # Vérification des changements de statut
        if original.status != expense.status:
            print(f"🔄 Changement de statut: {original.status} → {expense.status}")
            
            # Actions automatiques selon le nouveau statut
            if expense.status == 'submitted':
                _handle_submission(expense)
            elif expense.status == 'approved':
                _handle_approval(expense)
            elif expense.status == 'paid':
                _handle_payment(expense)
            elif expense.status == 'rejected':
                _handle_rejection(expense)
        
        # Vérification des changements de montant
        if original.amount != expense.amount and expense.project:
            print(f"💰 Changement de montant: ${original.amount} → ${expense.amount}")
            _handle_amount_change(expense, original.amount)
            
    except Expense.DoesNotExist:
        pass

def _handle_submission(expense):
    """Traitement de la soumission d'une dépense"""
    print(f"📤 Dépense soumise pour approbation: {expense.description}")
    
    # Notification aux approbateurs
    _notify_approvers(expense)
    
    # Validation automatique si montant faible
    if expense.amount <= 500:
        print(f"⚡ Validation automatique pour petite dépense (${expense.amount})")
        # Pourrait déclencher une approbation automatique

def _handle_approval(expense):
    """Traitement de l'approbation d'une dépense"""
    print(f"✅ Dépense approuvée: {expense.description}")
    
    # Mise à jour automatique du budget projet
    if expense.project:
        workflow = ExpenseWorkflow(expense)
        workflow._update_project_budget()
        
        # Création de l'engagement comptable
        workflow._create_accounting_entry()
        
        # Notification
        workflow._notify_approval()

def _handle_payment(expense):
    """Traitement du paiement d'une dépense"""
    print(f"💳 Dépense payée: {expense.description}")
    
    if expense.project:
        workflow = ExpenseWorkflow(expense)
        
        # Mise à jour de la trésorerie
        workflow._update_cash_flow()
        
        # Lettrage automatique
        workflow._auto_reconcile()
        
        # Notification
        workflow._notify_payment()

def _handle_rejection(expense):
    """Traitement du rejet d'une dépense"""
    print(f"❌ Dépense rejetée: {expense.description}")
    
    # Notification au créateur
    _notify_rejection(expense)

def _handle_amount_change(expense, old_amount):
    """Traitement du changement de montant"""
    if expense.project:
        workflow = ExpenseWorkflow(expense)
        budget_check = workflow._validate_budget(expense.amount)
        
        if not budget_check['valid']:
            print(f"🚨 Alerte: {budget_check['message']}")
            workflow._send_budget_alert("ATTENTION", budget_check['message'])

def _update_project_budget_from_invoice(project):
    """Mise à jour du budget projet à partir d'une facture payée"""
    try:
        # Recalcul du budget dépensé
        approved_expenses = Expense.objects.filter(
            project=project,
            status__in=['approved', 'paid']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        paid_invoices = Invoice.objects.filter(
            project=project,
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_spent = approved_expenses + paid_invoices
        
        # Mise à jour du projet
        project.spent = total_spent
        project.save()
        
        print(f"📊 Budget projet mis à jour: {project.name} - ${total_spent} dépensés")
        
        # Vérification des alertes
        _check_project_budget_alerts(project)
        
    except Exception as e:
        print(f"❌ Erreur mise à jour budget: {str(e)}")

def _check_project_budget_alerts(project):
    """Vérification des alertes budget d'un projet"""
    if project.budget and project.budget > 0:
        budget_usage = (project.spent / project.budget * 100)
        
        if budget_usage > 90:
            _send_budget_alert(project, "CRITIQUE", f"Budget utilisé à {budget_usage:.1f}%")
        elif budget_usage > 80:
            _send_budget_alert(project, "ATTENTION", f"Budget utilisé à {budget_usage:.1f}%")

def _send_budget_alert(project, level, message):
    """Envoi d'alerte budget"""
    alert_data = {
        'project': project.name,
        'level': level,
        'message': message,
        'budget': project.budget,
        'spent': project.spent,
        'remaining': project.budget - project.spent,
        'date': timezone.now().date()
    }
    
    print(f"🚨 Alerte budget {level}: {alert_data}")

def _send_high_amount_notification(expense):
    """Notification pour dépense importante"""
    notification = {
        'type': 'high_amount_expense',
        'title': 'Dépense importante créée',
        'message': f'Nouvelle dépense de ${expense.amount} créée pour {expense.project.name}',
        'expense': expense.description,
        'amount': expense.amount,
        'project': expense.project.name
    }
    
    print(f"💰 Notification dépense importante: {notification}")

def _notify_approvers(expense):
    """Notification aux approbateurs"""
    notification = {
        'type': 'expense_submitted',
        'title': 'Dépense soumise pour approbation',
        'message': f'Dépense "{expense.description}" en attente d\'approbation',
        'expense_id': expense.id,
        'amount': expense.amount,
        'project': expense.project.name if expense.project else 'Sans projet'
    }
    
    print(f"📨 Notification aux approbateurs: {notification}")

def _notify_rejection(expense):
    """Notification de rejet"""
    notification = {
        'type': 'expense_rejected',
        'title': 'Dépense rejetée',
        'message': f'Dépense "{expense.description}" a été rejetée',
        'expense_id': expense.id,
        'reason': 'Raison non spécifiée'  # À compléter avec un champ de raison
    }
    
    print(f"❌ Notification de rejet: {notification}")

# Configuration des signaux
def setup_expense_signals():
    """Configuration explicite des signaux (appelée dans apps.py)"""
    # Les signaux sont déjà enregistrés via les décorateurs @receiver
    print("✅ Signaux dépenses configurés")
