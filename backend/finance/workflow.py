"""
Workflow complet de gestion des dépenses
Intégration automatique entre projets et finance
"""

import os
import sys
import django
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string

# Configuration Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from projects.models import Project, Task
from finance.models import Expense, Invoice, Budget
from users.models import User

class ExpenseWorkflow:
    """Gestionnaire du workflow complet des dépenses"""
    
    def __init__(self, expense):
        self.expense = expense
        self.project = expense.project
        self.changes = []
        self.notifications = []
    
    def create_expense(self, data):
        """Création d'une nouvelle dépense avec validation"""
        try:
            # Validation du budget
            budget_check = self._validate_budget(data['amount'])
            if not budget_check['valid']:
                return {
                    'success': False,
                    'error': budget_check['message'],
                    'warnings': budget_check.get('warnings', [])
                }
            
            # Création de la dépense
            self.expense = Expense.objects.create(**data)
            self.project = self.expense.project
            
            # Notifications initiales
            self._notify_creation()
            
            return {
                'success': True,
                'expense': self.expense,
                'warnings': budget_check.get('warnings', []),
                'notifications': self.notifications
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Erreur lors de la création: {str(e)}"
            }
    
    def submit_for_approval(self, submitted_by):
        """Soumission pour approbation"""
        if self.expense.status != 'draft':
            return {'success': False, 'error': 'La dépense doit être en brouillon'}
        
        # Validation du budget avant soumission
        budget_check = self._validate_budget(self.expense.amount)
        if not budget_check['valid']:
            return {'success': False, 'error': budget_check['message']}
        
        # Mise à jour du statut
        self.expense.status = 'submitted'
        self.expense.submitted_by = submitted_by
        self.expense.save()
        
        # Notification aux approbateurs
        self._notify_approvers()
        
        self.changes.append("Dépense soumise pour approbation")
        
        return {
            'success': True,
            'expense': self.expense,
            'warnings': budget_check.get('warnings', []),
            'notifications': self.notifications
        }
    
    def approve_expense(self, approved_by):
        """Approbation de la dépense"""
        if self.expense.status not in ['submitted', 'under_review']:
            return {'success': False, 'error': 'Statut incompatible pour approbation'}
        
        # Validation finale du budget
        budget_check = self._validate_budget(self.expense.amount)
        if not budget_check['valid']:
            return {'success': False, 'error': budget_check['message']}
        
        # Mise à jour du statut
        self.expense.status = 'approved'
        self.expense.approved_by = approved_by
        self.expense.save()
        
        # Mise à jour du budget projet
        self._update_project_budget()
        
        # Création de l'engagement comptable
        self._create_accounting_entry()
        
        # Notification
        self._notify_approval()
        
        self.changes.append("Dépense approuvée et budget mis à jour")
        
        return {
            'success': True,
            'expense': self.expense,
            'budget_updated': True,
            'accounting_created': True,
            'notifications': self.notifications
        }
    
    def process_payment(self, paid_by, payment_date=None):
        """Traitement du paiement"""
        if self.expense.status != 'approved':
            return {'success': False, 'error': 'La dépense doit être approuvée'}
        
        # Mise à jour du statut
        self.expense.status = 'paid'
        self.expense.paid_by = paid_by
        self.expense.payment_date = payment_date or timezone.now().date()
        self.expense.save()
        
        # Mise à jour de la trésorerie
        self._update_cash_flow()
        
        # Lettrage automatique
        self._auto_reconcile()
        
        # Notification
        self._notify_payment()
        
        self.changes.append("Dépense payée et trésorerie mise à jour")
        
        return {
            'success': True,
            'expense': self.expense,
            'cash_flow_updated': True,
            'reconciled': True,
            'notifications': self.notifications
        }
    
    def _validate_budget(self, amount):
        """Validation du budget disponible"""
        if not self.project:
            return {'valid': True, 'message': 'Aucun projet associé'}
        
        # Conversion en float pour les calculs
        project_budget = float(self.project.budget or 0)
        project_spent = float(self.project.spent or 0)
        amount_float = float(amount)
        remaining_budget = project_budget - project_spent
        
        warnings = []
        
        # Validation stricte
        if amount_float > remaining_budget:
            return {
                'valid': False,
                'message': f'Budget insuffisant. Restant: ${remaining_budget:.2f}, Dépense: ${amount_float:.2f}'
            }
        
        # Alertes de risque
        budget_usage = (project_spent / project_budget * 100) if project_budget > 0 else 0
        if budget_usage > 80:
            warnings.append(f"Budget utilisé à {budget_usage:.1f}% - Risque de dépassement")
        
        if amount_float > remaining_budget * 0.5:
            warnings.append("Dépense importante (>50% du budget restant)")
        
        return {
            'valid': True,
            'message': f'Budget suffisant. Restant: ${remaining_budget:.2f}',
            'warnings': warnings
        }
    
    def _update_project_budget(self):
        """Mise à jour automatique du budget du projet"""
        if not self.project:
            return
        
        # Recalcul du budget dépensé
        approved_expenses = Expense.objects.filter(
            project=self.project,
            status__in=['approved', 'paid']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        paid_invoices = Invoice.objects.filter(
            project=self.project,
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_spent = approved_expenses + paid_invoices
        
        # Mise à jour du projet
        self.project.spent = total_spent
        self.project.save()
        
        # Vérification des alertes budget
        self._check_budget_alerts()
    
    def _create_accounting_entry(self):
        """Création de l'engagement comptable"""
        # Simulation de création d'écriture comptable
        accounting_data = {
            'expense': self.expense,
            'amount': self.expense.amount,
            'date': timezone.now().date(),
            'category': self.expense.category,
            'project': self.project,
            'description': f"Dépense: {self.expense.description}",
            'status': 'committed'
        }
        
        # Ici on pourrait créer un modèle AccountingEntry
        print(f"📊 Engagement comptable créé: {accounting_data}")
        
        self.changes.append("Engagement comptable créé")
    
    def _update_cash_flow(self):
        """Mise à jour de la trésorerie"""
        # Simulation de mise à jour trésorerie
        cash_flow_data = {
            'expense': self.expense,
            'amount': -self.expense.amount,  # Sortie de trésorerie
            'date': self.expense.payment_date,
            'type': 'expense_payment',
            'description': f"Paiement: {self.expense.description}"
        }
        
        print(f"💰 Trésorerie mise à jour: {cash_flow_data}")
        
        self.changes.append("Trésorerie mise à jour")
    
    def _auto_reconcile(self):
        """Lettrage automatique"""
        # Simulation de lettrage
        reconciliation_data = {
            'expense': self.expense,
            'amount': self.expense.amount,
            'date': timezone.now().date(),
            'status': 'reconciled',
            'method': 'auto'
        }
        
        print(f"🔗 Lettrage automatique: {reconciliation_data}")
        
        self.changes.append("Lettrage automatique effectué")
    
    def _check_budget_alerts(self):
        """Vérification des alertes budget"""
        if not self.project:
            return
        
        budget_usage = (self.project.spent / self.project.budget * 100) if self.project.budget > 0 else 0
        
        if budget_usage > 90:
            self._send_budget_alert("CRITIQUE", f"Budget utilisé à {budget_usage:.1f}%")
        elif budget_usage > 80:
            self._send_budget_alert("ATTENTION", f"Budget utilisé à {budget_usage:.1f}%")
    
    def _send_budget_alert(self, level, message):
        """Envoi d'alerte budget"""
        alert_data = {
            'project': self.project.name,
            'level': level,
            'message': message,
            'budget': self.project.budget,
            'spent': self.project.spent,
            'remaining': self.project.budget - self.project.spent,
            'date': timezone.now().date()
        }
        
        print(f"🚨 Alerte budget {level}: {alert_data}")
        
        self.notifications.append({
            'type': 'budget_alert',
            'level': level.lower(),
            'title': f'Alerte Budget - {self.project.name}',
            'message': message,
            'data': alert_data
        })
    
    def _notify_creation(self):
        """Notification de création"""
        self.notifications.append({
            'type': 'expense_created',
            'title': 'Nouvelle dépense créée',
            'message': f'Dépense "{self.expense.description}" créée pour le projet {self.project.name}',
            'recipients': ['project_manager', 'finance_team']
        })
    
    def _notify_approvers(self):
        """Notification aux approbateurs"""
        self.notifications.append({
            'type': 'expense_submitted',
            'title': 'Dépense soumise pour approbation',
            'message': f'Dépense "{self.expense.description}" en attente d\'approbation',
            'recipients': ['approvers', 'project_manager']
        })
    
    def _notify_approval(self):
        """Notification d'approbation"""
        self.notifications.append({
            'type': 'expense_approved',
            'title': 'Dépense approuvée',
            'message': f'Dépense "{self.expense.description}" approuvée et budget mis à jour',
            'recipients': ['project_manager', 'finance_team', 'accounting']
        })
    
    def _notify_payment(self):
        """Notification de paiement"""
        self.notifications.append({
            'type': 'expense_paid',
            'title': 'Dépense payée',
            'message': f'Dépense "{self.expense.description}" payée et comptabilisée',
            'recipients': ['project_manager', 'finance_team', 'accounting']
        })

class ExpenseWorkflowManager:
    """Manager central pour le workflow des dépenses"""
    
    @staticmethod
    def get_workflow_status(expense):
        """Retourne le statut détaillé du workflow"""
        status_info = {
            'draft': {
                'name': 'Brouillon',
                'description': 'Dépense en cours de saisie',
                'next_actions': ['submit'],
                'color': 'gray'
            },
            'submitted': {
                'name': 'Soumis',
                'description': 'En attente d\'approbation',
                'next_actions': ['review', 'approve', 'reject'],
                'color': 'blue'
            },
            'under_review': {
                'name': 'En révision',
                'description': 'Examen en cours par la finance',
                'next_actions': ['approve', 'reject', 'request_info'],
                'color': 'orange'
            },
            'approved': {
                'name': 'Approuvé',
                'description': 'Prêt pour paiement',
                'next_actions': ['process_payment'],
                'color': 'green'
            },
            'rejected': {
                'name': 'Rejeté',
                'description': 'Dépense refusée',
                'next_actions': ['resubmit'],
                'color': 'red'
            },
            'paid': {
                'name': 'Payé',
                'description': 'Paiement effectué',
                'next_actions': [],
                'color': 'purple'
            }
        }
        
        return status_info.get(expense.status, {
            'name': expense.status,
            'description': 'Statut inconnu',
            'next_actions': [],
            'color': 'gray'
        })
    
    @staticmethod
    def get_project_expenses_summary(project):
        """Résumé des dépenses d'un projet"""
        expenses = Expense.objects.filter(project=project)
        
        summary = {
            'total_count': expenses.count(),
            'total_amount': expenses.aggregate(total=Sum('amount'))['total'] or 0,
            'by_status': {},
            'by_category': {},
            'budget_usage': 0
        }
        
        # Par statut
        for status in ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']:
            status_expenses = expenses.filter(status=status)
            summary['by_status'][status] = {
                'count': status_expenses.count(),
                'amount': status_expenses.aggregate(total=Sum('amount'))['total'] or 0
            }
        
        # Par catégorie
        for category in ['materials', 'labor', 'equipment', 'transport', 'utilities', 'consulting', 'software', 'other']:
            category_expenses = expenses.filter(category=category)
            summary['by_category'][category] = {
                'count': category_expenses.count(),
                'amount': category_expenses.aggregate(total=Sum('amount'))['total'] or 0
            }
        
        # Usage budget
        if project.budget and project.budget > 0:
            summary['budget_usage'] = (project.spent / project.budget * 100)
        
        return summary

# Fonctions utilitaires
def create_expense_with_workflow(data, user):
    """Création d'une dépense avec workflow complet"""
    expense = Expense(**{k: v for k, v in data.items() if k != 'id'})
    workflow = ExpenseWorkflow(expense)
    return workflow.create_expense(data)

def process_expense_approval(expense_id, user):
    """Traitement de l'approbation d'une dépense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        workflow = ExpenseWorkflow(expense)
        return workflow.approve_expense(user)
    except Expense.DoesNotExist:
        return {'success': False, 'error': 'Dépense non trouvée'}

def process_expense_payment(expense_id, user, payment_date=None):
    """Traitement du paiement d'une dépense"""
    try:
        expense = Expense.objects.get(id=expense_id)
        workflow = ExpenseWorkflow(expense)
        return workflow.process_payment(user, payment_date)
    except Expense.DoesNotExist:
        return {'success': False, 'error': 'Dépense non trouvée'}
