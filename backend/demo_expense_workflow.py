#!/usr/bin/env python
"""
Script de démonstration du workflow complet des dépenses
et de leur intégration avec les projets.
"""

import os
import sys
import django

# Configuration de Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from projects.models import Project
from finance.models import Expense, Invoice
from users.models import User

def demo_expense_workflow():
    """Démonstration du workflow complet des dépenses"""
    print("🚀 DÉMONSTRATION DU WORKFLOW DES DÉPENSES")
    print("=" * 60)
    
    # Récupérer les projets existants
    projects = Project.objects.all()
    print(f"📊 Projets disponibles: {projects.count()}")
    
    for project in projects:
        print(f"\n--- Projet: {project.name} ---")
        print(f"   Budget: ${project.budget}")
        print(f"   Dépensé actuel: ${project.spent}")
        print(f"   Budget restant: ${project.budget - project.spent}")
        
        # Dépenses existantes pour ce projet
        expenses = Expense.objects.filter(project=project)
        print(f"   Dépenses associées: {expenses.count()}")
        
        for expense in expenses:
            print(f"   💰 {expense.category}: ${expense.amount} - {expense.get_workflow_status()}")
    
    print(f"\n{'='*60}")
    print("📋 WORKFLOW DES DÉPENSES")
    print(f"{'='*60}")
    
    # Créer une dépense de démonstration
    demo_project = projects.first()
    if demo_project:
        print(f"\n🎯 Création d'une dépense de démonstration pour le projet: {demo_project.name}")
        
        # Simulation d'une nouvelle dépense
        print("\n1. 📝 CRÉATION D'UNE DÉPENSE (Brouillon)")
        print("   - Catégorie: Matériaux")
        print("   - Montant: $500")
        print("   - Statut: Brouillon")
        print("   - Validation budget: En attente")
        
        # Validation budget (simulation)
        remaining_budget = demo_project.budget - demo_project.spent
        budget_available = remaining_budget >= 500
        budget_message = f"Budget suffisant. Restant: ${remaining_budget}" if budget_available else f"Budget insuffisant. Restant: ${remaining_budget}"
        print(f"   - Budget disponible: {budget_message}")
        
        print("\n2. 📤 SOUMISSION POUR APPROBATION")
        print("   - Statut: Soumis")
        print("   - Validation automatique du budget")
        print("   - Notification au responsable")
        
        print("\n3. 🔍 RÉVISION")
        print("   - Statut: En révision")
        print("   - Vérification des justificatifs")
        print("   - Validation des montants")
        
        print("\n4. ✅ APPROBATION")
        print("   - Statut: Approuvé")
        print("   - Budget réservé")
        print("   - Prêt pour paiement")
        
        print("\n5. 💳 PAIEMENT")
        print("   - Statut: Payé")
        print("   - Date de paiement enregistrée")
        print("   - Budget consommé")
        print("   - Synchronisation automatique avec le projet")
        
        print(f"\n{'='*60}")
        print("🔄 SYNCHRONISATION AUTOMATIQUE")
        print(f"{'='*60}")
        
        # Synchronisation automatique
        print("\n📊 ÉTAT AVANT SYNCHRONISATION:")
        print(f"   - Projet: {demo_project.name}")
        print(f"   - Budget: ${demo_project.budget}")
        print(f"   - Dépensé: ${demo_project.spent}")
        
        # Synchroniser le projet
        finance_sync_result = demo_project.sync_with_finance()
        
        print("\n🔄 SYNCHRONISATION EN COURS...")
        print(f"   - Dépenses approuvées: {Expense.objects.filter(project=demo_project, status='approved').count()}")
        print(f"   - Dépenses payées: {Expense.objects.filter(project=demo_project, status='paid').count()}")
        print(f"   - Factures payées: {Invoice.objects.filter(project=demo_project, status='paid').count()}")
        
        print("\n📊 ÉTAT APRÈS SYNCHRONISATION:")
        print(f"   - Dépensé recalculé: ${finance_sync_result['new_spent']}")
        print(f"   - Budget utilisé: {finance_sync_result['budget_used_percentage']:.1f}%")
        print(f"   - Statut budget: {finance_sync_result['budget_status']}")
        
        if finance_sync_result['spent_changed']:
            print("   ✅ Budget du projet mis à jour automatiquement")
        else:
            print("   ℹ️  Aucun changement nécessaire")
    
    print(f"\n{'='*60}")
    print("🎯 FONCTIONNALITÉS CLÉS")
    print(f"{'='*60}")
    
    print("\n✅ WORKFLOW COMPLET:")
    print("   - Brouillon → Soumis → En révision → Approuvé → Payé")
    print("   - Validation automatique du budget")
    print("   - Gestion des priorités (Faible, Moyenne, Haute, Urgente)")
    
    print("\n✅ INTÉGRATION PROJETS:")
    print("   - Synchronisation automatique budget/dépenses")
    print("   - Signaux en temps réel")
    print("   - Validation de cohérence")
    
    print("\n✅ GESTION DES RISQUES:")
    print("   - Alertes budget insuffisant")
    print("   - Détection des dépassements")
    print("   - Suivi des délais de paiement")
    
    print("\n✅ RAPPORTS ET ANALYSE:")
    print("   - Analyse par catégorie")
    print("   - Suivi des délais d'approbation")
    print("   - Tableaux de bord en temps réel")

def show_expense_statistics():
    """Affiche les statistiques des dépenses"""
    print(f"\n{'='*60}")
    print("📈 STATISTIQUES DES DÉPENSES")
    print(f"{'='*60}")
    
    # Statistiques globales
    total_expenses = Expense.objects.count()
    approved_expenses = Expense.objects.filter(status='approved').count()
    paid_expenses = Expense.objects.filter(status='paid').count()
    pending_expenses = Expense.objects.filter(status__in=['draft', 'submitted', 'under_review']).count()
    
    print(f"📊 Dépenses totales: {total_expenses}")
    print(f"✅ Approuvées: {approved_expenses}")
    print(f"💳 Payées: {paid_expenses}")
    print(f"⏳ En attente: {pending_expenses}")
    
    # Analyse par catégorie
    print(f"\n📂 RÉPARTITION PAR CATÉGORIE:")
    categories = Expense.CATEGORY_CHOICES
    for category_code, category_name in categories:
        count = Expense.objects.filter(category=category_code).count()
        if count > 0:
            print(f"   - {category_name}: {count} dépenses")
    
    # Analyse par statut
    print(f"\n🎯 RÉPARTITION PAR STATUT:")
    statuses = Expense.STATUS_CHOICES
    for status_code, status_name in statuses:
        count = Expense.objects.filter(status=status_code).count()
        if count > 0:
            print(f"   - {status_name}: {count} dépenses")

if __name__ == "__main__":
    demo_expense_workflow()
    show_expense_statistics()
