from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
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

# ============================================================
# SIGNAL DE SYNCHRONISATION BUDGET - Opérations (nouvelle logique)
# ============================================================
# Logique:
# - Le budget du projet (project.budget) est utilisé par les opérations
# - Quand une opération est payée, elle déduit du budget projet (project.spent)
# - Les dépenses sont prélevées sur la caisse des opérations, PAS sur le budget projet
# ============================================================

@receiver(post_save, sender='finance.OperationRequest')
def sync_project_on_operation_change(sender, instance, **kwargs):
    """
    Synchronise automatiquement le budget du projet lorsqu'une opération est modifiée.
    Se déclenche quand une opération passe en statut 'paid'.
    """
    try:
        if instance.project and instance.status == 'paid':
            project = instance.project
            finance_sync_result = project.sync_with_finance()
            
            # Sauvegarder les changements si nécessaire
            if finance_sync_result['spent_changed']:
                project.save()
                print(f"✅ Budget du projet {project.name} synchronisé automatiquement "
                      f"(opération {instance.reference} payée): "
                      f"dépensé={finance_sync_result['new_spent']}, "
                      f"budget utilisé={finance_sync_result['budget_used_percentage']:.1f}%, "
                      f"statut={finance_sync_result['budget_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation budget du projet (opération): {e}")

@receiver(post_delete, sender='finance.OperationRequest')
def sync_project_on_operation_delete(sender, instance, **kwargs):
    """
    Synchronise automatiquement le budget du projet lorsqu'une opération est supprimée.
    """
    try:
        if instance.project and instance.status == 'paid':
            project = instance.project
            finance_sync_result = project.sync_with_finance()
            
            # Sauvegarder les changements si nécessaire
            if finance_sync_result['spent_changed']:
                project.save()
                print(f"✅ Budget du projet {project.name} synchronisé après suppression "
                      f"d'opération {instance.reference}: "
                      f"dépensé={finance_sync_result['new_spent']}, "
                      f"budget utilisé={finance_sync_result['budget_used_percentage']:.1f}%, "
                      f"statut={finance_sync_result['budget_status']}")
    except Exception as e:
        print(f"Erreur lors de la synchronisation budget après suppression d'opération: {e}")
