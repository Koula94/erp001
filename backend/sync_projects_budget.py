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
from finance.models import OperationRequest

def sync_all_projects_budget():
    """Synchronise le budget de tous les projets avec les données finance.
    
    Logique:
    - Le budget du projet (project.budget) est utilisé par les opérations
    - Quand une opération est payée, elle déduit du budget projet (project.spent)
    - Les dépenses sont prélevées sur la caisse des opérations, PAS sur le budget projet
    """
    projects = Project.objects.all()
    print(f"Synchronisation du budget pour {projects.count()} projets...")
    
    results = []
    
    for project in projects:
        print(f"\n--- Projet: {project.name} ---")
        print(f"Budget total: ${project.budget}")
        print(f"Dépensé actuel: ${project.spent}")
        
        # Calculer le montant réel dépensé (basé uniquement sur les opérations payées)
        real_spent = project.calculate_spent_from_finance()
        budget_used = (real_spent / project.budget) * 100 if project.budget > 0 else 0
        budget_status = project.get_budget_status()
        budget_risk = project.get_budget_risk_level()
        
        print(f"Dépensé réel (calculé via opérations payées): ${real_spent}")
        print(f"Budget utilisé: {budget_used:.1f}%")
        print(f"Statut budget: {budget_status}")
        print(f"Risque budget: {budget_risk}")
        
        # Compter les opérations
        operations_count = OperationRequest.objects.filter(project=project).count()
        paid_operations_count = OperationRequest.objects.filter(project=project, status='paid').count()
        
        print(f"Opérations totales: {operations_count} (payées: {paid_operations_count})")
        
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
