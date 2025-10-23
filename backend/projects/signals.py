from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Project, Task

@receiver(post_save, sender=Task)
def sync_project_on_task_change(sender, instance, **kwargs):
    """
    Synchronise automatiquement le projet lorsqu'une tâche est créée ou modifiée
    """
    try:
        project = instance.project
        sync_result = project.sync_with_tasks()
        
        # Sauvegarder les changements si nécessaire
        if sync_result['progress_changed'] or sync_result['status_changed']:
            project.save()
            print(f"Projet {project.name} synchronisé automatiquement: "
                  f"progression={sync_result['new_progress']}%, "
                  f"statut={sync_result['new_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation automatique du projet: {e}")

@receiver(post_delete, sender=Task)
def sync_project_on_task_delete(sender, instance, **kwargs):
    """
    Synchronise automatiquement le projet lorsqu'une tâche est supprimée
    """
    try:
        project = instance.project
        sync_result = project.sync_with_tasks()
        
        # Sauvegarder les changements si nécessaire
        if sync_result['progress_changed'] or sync_result['status_changed']:
            project.save()
            print(f"Projet {project.name} synchronisé après suppression de tâche: "
                  f"progression={sync_result['new_progress']}%, "
                  f"statut={sync_result['new_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation après suppression de tâche: {e}")

# Signaux pour la synchronisation budget-finance
@receiver(post_save, sender='finance.Expense')
@receiver(post_save, sender='finance.Invoice')
def sync_project_on_finance_change(sender, instance, **kwargs):
    """
    Synchronise automatiquement le budget du projet lorsqu'une dépense ou facture est modifiée
    """
    try:
        if instance.project:
            project = instance.project
            finance_sync_result = project.sync_with_finance()
            
            # Sauvegarder les changements si nécessaire
            if finance_sync_result['spent_changed']:
                project.save()
                print(f"Budget du projet {project.name} synchronisé automatiquement: "
                      f"dépensé=${finance_sync_result['new_spent']}, "
                      f"budget utilisé={finance_sync_result['budget_used_percentage']:.1f}%, "
                      f"statut={finance_sync_result['budget_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation budget du projet: {e}")

@receiver(post_delete, sender='finance.Expense')
@receiver(post_delete, sender='finance.Invoice')
def sync_project_on_finance_delete(sender, instance, **kwargs):
    """
    Synchronise automatiquement le budget du projet lorsqu'une dépense ou facture est supprimée
    """
    try:
        if instance.project:
            project = instance.project
            finance_sync_result = project.sync_with_finance()
            
            # Sauvegarder les changements si nécessaire
            if finance_sync_result['spent_changed']:
                project.save()
                print(f"Budget du projet {project.name} synchronisé après suppression: "
                      f"dépensé=${finance_sync_result['new_spent']}, "
                      f"budget utilisé={finance_sync_result['budget_used_percentage']:.1f}%, "
                      f"statut={finance_sync_result['budget_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation budget après suppression: {e}")
