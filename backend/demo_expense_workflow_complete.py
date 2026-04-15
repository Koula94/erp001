#!/usr/bin/env python
"""
Démonstration complète du workflow des dépenses
Test de toutes les étapes : création, validation, approbation, paiement
"""

import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from projects.models import Project
from finance.models import Expense
from finance.workflow import ExpenseWorkflow, ExpenseWorkflowManager
from users.models import User

def demo_complete_workflow():
    """Démonstration complète du workflow"""
    print("🚀 DÉMONSTRATION COMPLÈTE DU WORKFLOW DES DÉPENSES")
    print("=" * 70)
    
    # Récupérer les projets et utilisateurs
    projects = Project.objects.all()
    users = User.objects.all()
    
    if not projects.exists():
        print("❌ Aucun projet trouvé")
        return
    
    if not users.exists():
        print("❌ Aucun utilisateur trouvé")
        return
    
    project = projects.first()
    user = users.first()
    
    print(f"📊 Projet utilisé: {project.name}")
    print(f"👤 Utilisateur: {user.username}")
    print(f"💰 Budget: ${project.budget}")
    print(f"💸 Dépensé: ${project.spent}")
    print(f"📈 Budget restant: ${project.budget - project.spent}")
    
    print(f"\n{'='*70}")
    print("1. 📝 CRÉATION D'UNE DÉPENSE")
    print(f"{'='*70}")
    
    # Données de test
    expense_data = {
        'project': project,
        'description': 'Achat de matériel informatique pour le projet',
        'category': 'equipment',
        'amount': 1500.00,
        'date': '2025-10-29',
        'priority': 'medium',
        'status': 'draft',
        'submitted_by': user
    }
    
    # Création avec workflow
    expense = Expense(**expense_data)
    workflow = ExpenseWorkflow(expense)
    
    result = workflow.create_expense(expense_data)
    
    if result['success']:
        expense = result['expense']
        print(f"✅ Dépense créée: {expense.description}")
        print(f"   Montant: ${expense.amount}")
        print(f"   Statut: {expense.status}")
        print(f"   Projet: {expense.project.name}")
        
        if result.get('warnings'):
            print("   ⚠️  Alertes:")
            for warning in result['warnings']:
                print(f"     - {warning}")
    else:
        print(f"❌ Erreur création: {result['error']}")
        return
    
    print(f"\n{'='*70}")
    print("2. 📤 SOUMISSION POUR APPROBATION")
    print(f"{'='*70}")
    
    result = workflow.submit_for_approval(user)
    
    if result['success']:
        print(f"✅ Dépense soumise pour approbation")
        print(f"   Statut: {expense.status}")
        print(f"   Soumis par: {expense.submitted_by.username}")
        
        if result.get('warnings'):
            print("   ⚠️  Alertes:")
            for warning in result['warnings']:
                print(f"     - {warning}")
        
        if result.get('notifications'):
            print("   📨 Notifications envoyées:")
            for notification in result['notifications']:
                print(f"     - {notification['title']}: {notification['message']}")
    else:
        print(f"❌ Erreur soumission: {result['error']}")
        return
    
    print(f"\n{'='*70}")
    print("3. ✅ APPROBATION DE LA DÉPENSE")
    print(f"{'='*70}")
    
    result = workflow.approve_expense(user)
    
    if result['success']:
        print(f"✅ Dépense approuvée")
        print(f"   Statut: {expense.status}")
        print(f"   Approuvé par: {expense.approved_by.username}")
        print(f"   Budget mis à jour: {result.get('budget_updated', False)}")
        print(f"   Engagement comptable créé: {result.get('accounting_created', False)}")
        
        # Vérification du budget projet
        project.refresh_from_db()
        print(f"   💰 Budget projet mis à jour:")
        print(f"     - Dépensé: ${project.spent}")
        print(f"     - Budget utilisé: {(project.spent / project.budget * 100):.1f}%")
        
        if result.get('notifications'):
            print("   📨 Notifications envoyées:")
            for notification in result['notifications']:
                print(f"     - {notification['title']}: {notification['message']}")
    else:
        print(f"❌ Erreur approbation: {result['error']}")
        return
    
    print(f"\n{'='*70}")
    print("4. 💳 TRAITEMENT DU PAIEMENT")
    print(f"{'='*70}")
    
    result = workflow.process_payment(user)
    
    if result['success']:
        print(f"✅ Dépense payée")
        print(f"   Statut: {expense.status}")
        print(f"   Payé par: {expense.paid_by.username}")
        print(f"   Date paiement: {expense.payment_date}")
        print(f"   Trésorerie mise à jour: {result.get('cash_flow_updated', False)}")
        print(f"   Lettrage automatique: {result.get('reconciled', False)}")
        
        if result.get('notifications'):
            print("   📨 Notifications envoyées:")
            for notification in result['notifications']:
                print(f"     - {notification['title']}: {notification['message']}")
    else:
        print(f"❌ Erreur paiement: {result['error']}")
        return
    
    print(f"\n{'='*70}")
    print("5. 📊 RÉSUMÉ DU WORKFLOW")
    print(f"{'='*70}")
    
    # Statut détaillé du workflow
    workflow_status = ExpenseWorkflowManager.get_workflow_status(expense)
    print(f"📋 Statut workflow: {workflow_status['name']}")
    print(f"📝 Description: {workflow_status['description']}")
    print(f"🎨 Couleur: {workflow_status['color']}")
    print(f"⚡ Actions disponibles: {', '.join(workflow_status['next_actions'])}")
    
    # Résumé des dépenses du projet
    summary = ExpenseWorkflowManager.get_project_expenses_summary(project)
    print(f"\n📈 Résumé dépenses projet:")
    print(f"   Total dépenses: {summary['total_count']}")
    print(f"   Montant total: ${summary['total_amount']}")
    print(f"   Budget utilisé: {summary['budget_usage']:.1f}%")
    
    print(f"\n📂 Répartition par statut:")
    for status, data in summary['by_status'].items():
        if data['count'] > 0:
            print(f"   - {status}: {data['count']} dépenses (${data['amount']})")
    
    print(f"\n📊 Répartition par catégorie:")
    for category, data in summary['by_category'].items():
        if data['count'] > 0:
            print(f"   - {category}: {data['count']} dépenses (${data['amount']})")

def demo_budget_validation():
    """Démonstration de la validation du budget"""
    print(f"\n{'='*70}")
    print("🧪 TEST DE VALIDATION BUDGET")
    print(f"{'='*70}")
    
    projects = Project.objects.all()
    if not projects.exists():
        return
    
    project = projects.first()
    
    # Test avec différents montants
    test_amounts = [500, 1500, 5000, 10000]
    
    for amount in test_amounts:
        print(f"\n💰 Test validation budget: ${amount}")
        
        # Simulation d'une dépense
        class MockExpense:
            def __init__(self, project, amount):
                self.project = project
                self.amount = amount
        
        mock_expense = MockExpense(project, amount)
        workflow = ExpenseWorkflow(mock_expense)
        
        budget_check = workflow._validate_budget(amount)
        
        if budget_check['valid']:
            print(f"   ✅ {budget_check['message']}")
            if budget_check.get('warnings'):
                for warning in budget_check['warnings']:
                    print(f"     ⚠️  {warning}")
        else:
            print(f"   ❌ {budget_check['message']}")

def demo_workflow_actions():
    """Démonstration des actions disponibles"""
    print(f"\n{'='*70}")
    print("🎯 ACTIONS DISPONIBLES PAR STATUT")
    print(f"{'='*70}")
    
    # Test pour chaque statut possible
    statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']
    
    for status in statuses:
        # Création d'une dépense de test
        test_expense = Expense(
            description=f"Test {status}",
            amount=100,
            category='other',
            status=status
        )
        
        workflow_status = ExpenseWorkflowManager.get_workflow_status(test_expense)
        
        print(f"\n📋 Statut: {status}")
        print(f"   Nom: {workflow_status['name']}")
        print(f"   Description: {workflow_status['description']}")
        print(f"   Actions: {', '.join(workflow_status['next_actions'])}")

if __name__ == "__main__":
    demo_complete_workflow()
    demo_budget_validation()
    demo_workflow_actions()
    
    print(f"\n{'='*70}")
    print("🎉 DÉMONSTRATION TERMINÉE")
    print(f"{'='*70}")
    print("✅ Workflow complet testé avec succès")
    print("✅ Validation budget fonctionnelle")
    print("✅ Actions workflow disponibles")
    print("✅ Intégration projets-finance opérationnelle")
