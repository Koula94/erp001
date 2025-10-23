#!/usr/bin/env python
"""
Script pour synchroniser la progression de tous les projets existants
avec leurs tâches actuelles.
"""

import os
import sys
import django

# Configuration de Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from projects.models import Project

def sync_all_projects():
    """Synchronise tous les projets avec leurs tâches"""
    projects = Project.objects.all()
    print(f"Synchronisation de {projects.count()} projets...")
    
    results = []
    
    for project in projects:
        print(f"\n--- Projet: {project.name} ---")
        print(f"Progression actuelle: {project.progress}%")
        print(f"Statut actuel: {project.status}")
        
        # Compter les tâches
        tasks_count = project.tasks.count()
        completed_tasks = project.tasks.filter(status='completed').count()
        in_progress_tasks = project.tasks.filter(status='in-progress').count()
        
        print(f"Tâches totales: {tasks_count}")
        print(f"Tâches terminées: {completed_tasks}")
        print(f"Tâches en cours: {in_progress_tasks}")
        
        # Synchroniser
        sync_result = project.sync_with_tasks()
        
        print(f"Nouvelle progression: {sync_result['new_progress']}%")
        print(f"Nouveau statut: {sync_result['new_status']}")
        print(f"Progression changée: {sync_result['progress_changed']}")
        print(f"Statut changé: {sync_result['status_changed']}")
        
        # Sauvegarder si nécessaire
        if sync_result['progress_changed'] or sync_result['status_changed']:
            project.save()
            print("✅ Projet sauvegardé")
        else:
            print("ℹ️  Aucun changement nécessaire")
        
        results.append({
            'project': project.name,
            'old_progress': project.progress,
            'new_progress': sync_result['new_progress'],
            'old_status': project.status,
            'new_status': sync_result['new_status'],
            'tasks_count': tasks_count,
            'changed': sync_result['progress_changed'] or sync_result['status_changed']
        })
    
    # Résumé
    print(f"\n{'='*50}")
    print("RÉSUMÉ DE LA SYNCHRONISATION")
    print(f"{'='*50}")
    
    changed_projects = [r for r in results if r['changed']]
    print(f"Projets modifiés: {len(changed_projects)}/{len(results)}")
    
    for result in changed_projects:
        print(f"\n📊 {result['project']}:")
        print(f"   Progression: {result['old_progress']}% → {result['new_progress']}%")
        print(f"   Statut: {result['old_status']} → {result['new_status']}")
        print(f"   Tâches: {result['tasks_count']}")

if __name__ == "__main__":
    sync_all_projects()
