#!/usr/bin/env python
"""
Script pour synchroniser le budget de tous les projets existants
avec les données finance (dépenses et factures).
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

def sync_all_projects_budget():
    """Synchronise le budget de tous les projets avec les données finance"""
    projects = Project.objects.all()
    print(f"Synchronisation du budget pour {projects.count()} projets...")
    
    results = []
    
    for project in projects:
        print(f"\n--- Projet: {project.name} ---")
        print(f"Budget total: ${project.budget}")
        print(f"Dépensé actuel: ${project.spent}")
        
        # Calculer le montant réel dépensé
        real_spent = project.calculate_spent_from_finance()
        budget_used = (real_spent / project.budget) * 100 if project.budget > 0 else 0
        budget_status = project.get_budget_status()
        budget_risk = project.get_budget_risk_level()
        
        print(f"Dépensé réel (calculé): ${real_spent}")
        print(f"Budget utilisé: {budget_used:.1f}%")
        print(f"Statut budget: {budget_status}")
        print(f"Risque budget: {budget_risk}")
        
        # Compter les dépenses et factures
        expenses_count = Expense.objects.filter(project=project).count()
        approved_expenses_count = Expense.objects.filter(project=project, status='approved').count()
        invoices_count = Invoice.objects.filter(project=project).count()
        paid_invoices_count = Invoice.objects.filter(project=project, status='paid').count()
        
        print(f"Dépenses totales: {expenses_count} (approuvées: {approved_expenses_count})")
        print(f"Factures totales: {invoices_count} (payées: {paid_invoices_count})")
        
        # Synchroniser
        finance_sync_result = project.sync_with_finance()
        
        print(f"Changement dépensé: {finance_sync_result['spent_changed']}")
        print(f"Nouveau dépensé: ${finance_sync_result['new_spent']}")
        print(f"Budget utilisé: {finance_sync_result['budget_used_percentage']:.1f}%")
        print(f"Statut budget: {finance_sync_result['budget_status']}")
        
        # Sauvegarder si nécessaire
        if finance_sync_result['spent_changed']:
            project.save()
            print("✅ Budget du projet sauvegardé")
        else:
            print("ℹ️  Aucun changement nécessaire")
        
        # Évaluation du risque global
        overall_risk = project.get_overall_risk_level()
        print(f"Risque global: {overall_risk}")
        
        results.append({
            'project': project.name,
            'old_spent': project.spent,
            'new_spent': finance_sync_result['new_spent'],
            'budget': project.budget,
            'budget_used': budget_used,
            'budget_status': budget_status,
            'budget_risk': budget_risk,
            'overall_risk': overall_risk,
            'changed': finance_sync_result['spent_changed']
        })
    
    # Résumé
    print(f"\n{'='*50}")
    print("RÉSUMÉ DE LA SYNCHRONISATION BUDGET")
    print(f"{'='*50}")
    
    changed_projects = [r for r in results if r['changed']]
    print(f"Projets modifiés: {len(changed_projects)}/{len(results)}")
    
    # Analyse des risques
    high_risk_projects = [r for r in results if r['overall_risk'] == 'high']
    medium_risk_projects = [r for r in results if r['overall_risk'] == 'medium']
    
    print(f"\n📊 ANALYSE DES RISQUES:")
    print(f"   Risque élevé: {len(high_risk_projects)} projets")
    print(f"   Risque moyen: {len(medium_risk_projects)} projets")
    print(f"   Risque faible: {len(results) - len(high_risk_projects) - len(medium_risk_projects)} projets")
    
    for result in changed_projects:
        print(f"\n💰 {result['project']}:")
        print(f"   Dépensé: ${result['old_spent']} → ${result['new_spent']}")
        print(f"   Budget utilisé: {result['budget_used']:.1f}%")
        print(f"   Statut: {result['budget_status']}")
        print(f"   Risque: {result['overall_risk']}")

if __name__ == "__main__":
    sync_all_projects_budget()
