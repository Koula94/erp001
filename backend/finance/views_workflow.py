"""
Vues API pour le workflow des dépenses
Exposition des fonctionnalités workflow au frontend
"""

import json

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Expense
from .workflow import (
    ExpenseWorkflow,
    ExpenseWorkflowManager,
    create_expense_with_workflow,
    process_expense_approval
)
from projects.models import Project

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_expense_workflow(request):
    """Création d'une dépense avec workflow complet"""
    try:
        data = request.data.copy()
        
        # Log des données reçues pour débogage
        print(f"[DEBUG] Données reçues pour création de dépense: {data}")
        
        # Normaliser les données du QueryDict (extraire les valeurs simples des listes)
        for key in list(data.keys()):
            value = data[key]
            if isinstance(value, list):
                if len(value) == 1:
                    data[key] = value[0]
                elif len(value) == 0:
                    data[key] = None
        
        # Log des données normalisées
        print(f"[DEBUG] Données normalisées: {data}")
        
        # Récupération du fichier de justificatif depuis request.FILES
        receipt_file = request.FILES.get('receipt')
        if receipt_file:
            data['receipt'] = receipt_file
            print(f"[DEBUG] Fichier reçu: {receipt_file.name} ({receipt_file.size} bytes)")
        else:
            print(f"[DEBUG] Aucun fichier reçu dans la requête")
            print(f"[DEBUG] FILES disponibles: {list(request.FILES.keys())}")
        
        # Ajout de l'utilisateur connecté comme créateur
        data['submitted_by'] = request.user  # Passer l'instance User, pas juste l'ID
        
        # Validation des données requises avec messages plus clairs
        required_fields = [
            ('description', 'Description'),
            ('category', 'Catégorie'),
            ('amount', 'Montant'),
            ('date', 'Date'),
        ]
        
        missing_fields = []
        for field_key, field_name in required_fields:
            value = data.get(field_key)
            if value is None or (isinstance(value, str) and not value.strip()):
                missing_fields.append(field_name)
        
        if missing_fields:
            return Response({
                'success': False,
                'error': f'Champs obligatoires manquants: {", ".join(missing_fields)}',
                'missing_fields': missing_fields
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation du montant
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return Response({
                    'success': False,
                    'error': 'Le montant doit être supérieur à 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            # Convertir le montant en float pour éviter les comparaisons str vs int
            data['amount'] = amount
        except (ValueError, TypeError):
            return Response({
                'success': False,
                'error': 'Montant invalide. Doit être un nombre'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupération de l'instance du projet (optionnel)
        project_value = data.get('project')
        if project_value is not None and project_value != '' and project_value != 'None':
            try:
                project_id = project_value
                # Convertir en entier si c'est une chaîne
                if isinstance(project_id, str):
                    project_id = int(project_id)
                
                project = Project.objects.get(id=project_id)
                data['project'] = project  # Passer l'instance du projet, pas juste l'ID
                print(f"[DEBUG] Projet trouvé: {project.name} (ID: {project.id})")
            except (Project.DoesNotExist, ValueError, TypeError) as e:
                print(f"[DEBUG] Erreur projet: {e}")
                return Response({
                    'success': False,
                    'error': f'Projet avec ID {project_value} non trouvé ou invalide'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Pas de projet associé
            data['project'] = None
            print(f"[DEBUG] Aucun projet associé à la dépense")
        
        # Validation des sous-catégories si présentes
        if 'subcategories' in data and data['subcategories']:
            try:
                subcategories = data['subcategories']
                
                # Cas FormData: liste contenant une chaîne JSON
                if isinstance(subcategories, list) and len(subcategories) == 1 and isinstance(subcategories[0], str):
                    try:
                        subcategories = json.loads(subcategories[0])
                    except json.JSONDecodeError:
                        subcategories = []
                
                # Cas FormData ou autre: chaîne JSON directe
                elif isinstance(subcategories, str):
                    try:
                        subcategories = json.loads(subcategories)
                    except json.JSONDecodeError:
                        subcategories = []
                
                # S'assurer que subcategories est une liste
                if not isinstance(subcategories, list):
                    return Response({
                        'success': False,
                        'error': 'Le champ subcategories doit être une liste'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Mettre à jour data avec la valeur parsée
                data['subcategories'] = subcategories
                
                # Valider chaque sous-catégorie
                for i, subcat in enumerate(subcategories):
                    if not isinstance(subcat, dict):
                        return Response({
                            'success': False,
                            'error': f'Sous-catégorie {i+1} doit être un objet'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    if 'name' not in subcat or not subcat['name']:
                        return Response({
                            'success': False,
                            'error': f'Sous-catégorie {i+1}: nom manquant'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    try:
                        subcat_amount = float(subcat.get('amount', 0))
                        if subcat_amount < 0:
                            return Response({
                                'success': False,
                                'error': f'Sous-catégorie "{subcat["name"]}": montant négatif'
                            }, status=status.HTTP_400_BAD_REQUEST)
                    except (ValueError, TypeError):
                        return Response({
                            'success': False,
                            'error': f'Sous-catégorie "{subcat["name"]}": montant invalide'
                        }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"[DEBUG] Erreur validation sous-catégories: {e}")
        
        # Création avec workflow
        print(f"[DEBUG] Appel de create_expense_with_workflow avec données: {data}")
        result = create_expense_with_workflow(data, request.user)
        
        if result['success']:
            expense = result['expense']
            print(f"[DEBUG] Dépense créée avec succès: ID {expense.id}")
            
            # Construire l'URL du reçu si présent
            receipt_url = None
            if expense.receipt and hasattr(expense.receipt, 'url'):
                receipt_url = request.build_absolute_uri(expense.receipt.url)
            
            return Response({
                'success': True,
                'expense': {
                    'id': expense.id,
                    'description': expense.description,
                    'category': expense.category,
                    'subcategory': expense.subcategory,
                    'subcategories': expense.subcategories,
                    'amount': float(expense.amount),
                    'date': expense.date,
                    'status': expense.status,
                    'priority': expense.priority,
                    'fund_source': expense.fund_source,
                    'receipt': expense.receipt.url if expense.receipt else None,
                    'receipt_url': receipt_url,
                    'project': expense.project and {
                        'id': str(expense.project.id),
                        'name': expense.project.name
                    } or None,
                    'submitted_by': expense.submitted_by.id if expense.submitted_by else None,
                    'submitted_by_name': expense.submitted_by.get_full_name() if expense.submitted_by else None,
                    'created_at': expense.created_at,
                    'updated_at': expense.updated_at
                },
                'warnings': result.get('warnings', []),
                'notifications': result.get('notifications', []),
                'message': 'Dépense créée avec succès'
            }, status=status.HTTP_201_CREATED)
        else:
            print(f"[DEBUG] Erreur dans create_expense_with_workflow: {result.get('error')}")
            return Response({
                'success': False,
                'error': result['error'],
                'details': result.get('details', {})
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"[DEBUG] Exception non gérée dans create_expense_workflow: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'success': False,
            'error': f'Erreur lors de la création: {str(e)}',
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_expense_for_approval(request, expense_id):
    """Soumission d'une dépense pour approbation"""
    try:
        expense = get_object_or_404(Expense, id=expense_id)
        workflow = ExpenseWorkflow(expense)
        
        result = workflow.submit_for_approval(request.user)
        
        if result['success']:
            return Response({
                'success': True,
                'expense': {
                    'id': expense.id,
                    'status': expense.status,
                    'submitted_by': expense.submitted_by.username if expense.submitted_by else None
                },
                'warnings': result.get('warnings', []),
                'notifications': result.get('notifications', [])
            })
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la soumission: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_expense(request, expense_id):
    """Approbation d'une dépense"""
    try:
        result = process_expense_approval(expense_id, request.user)
        
        if result['success']:
            return Response({
                'success': True,
                'expense': {
                    'id': result['expense'].id,
                    'status': result['expense'].status,
                    'approved_by': result['expense'].approved_by.username if result['expense'].approved_by else None
                },
                'budget_updated': result.get('budget_updated', False),
                'accounting_created': result.get('accounting_created', False),
                'notifications': result.get('notifications', [])
            })
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de l\'approbation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# La vue process_expense_payment_api a été supprimée car le statut 'paid' n'existe plus pour les dépenses
# Les dépenses sont maintenant simplement approuvées et considérées comme engagées dans le budget

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_expense_workflow_status(request, expense_id):
    """Récupération du statut détaillé du workflow"""
    try:
        expense = get_object_or_404(Expense, id=expense_id)
        workflow_status = ExpenseWorkflowManager.get_workflow_status(expense)
        
        return Response({
            'success': True,
            'workflow_status': workflow_status,
            'expense': {
                'id': expense.id,
                'description': expense.description,
                'amount': float(expense.amount),
                'category': expense.category,
                'status': expense.status,
                'priority': expense.priority,
                'project': expense.project.name if expense.project else None
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la récupération: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_project_expenses_summary(request, project_id):
    """Récupération du résumé des dépenses d'un projet"""
    try:
        project = get_object_or_404(Project, id=project_id)
        summary = ExpenseWorkflowManager.get_project_expenses_summary(project)
        
        return Response({
            'success': True,
            'project': {
                'id': project.id,
                'name': project.name,
                'budget': float(project.budget) if project.budget else 0,
                'spent': float(project.spent) if project.spent else 0
            },
            'summary': summary
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la récupération: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_expense_budget(request):
    """Validation du budget pour une dépense"""
    try:
        project_id = request.data.get('project_id')
        amount = float(request.data.get('amount', 0))
        
        if not project_id:
            return Response({
                'valid': True,
                'message': 'Aucun projet associé'
            })
        
        project = get_object_or_404(Project, id=project_id)
        
        # Simulation d'une dépense pour la validation
        class MockExpense:
            def __init__(self, project, amount):
                self.project = project
                self.amount = amount
        
        mock_expense = MockExpense(project, amount)
        workflow = ExpenseWorkflow(mock_expense)
        
        budget_check = workflow._validate_budget(amount)
        
        return Response({
            'valid': budget_check['valid'],
            'message': budget_check['message'],
            'warnings': budget_check.get('warnings', []),
            'project': {
                'id': project.id,
                'name': project.name,
                'budget': float(project.budget) if project.budget else 0,
                'spent': float(project.spent) if project.spent else 0,
                'remaining': float(project.budget - project.spent) if project.budget else 0
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la validation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_expense_workflow_actions(request, expense_id):
    """Récupération des actions disponibles pour une dépense"""
    try:
        expense = get_object_or_404(Expense, id=expense_id)
        workflow_status = ExpenseWorkflowManager.get_workflow_status(expense)
        
        # Détermination des actions disponibles selon le statut
        actions = []
        
        if expense.status == 'draft':
            actions = [
                {'action': 'submit', 'label': 'Soumettre pour approbation', 'type': 'primary'},
                {'action': 'edit', 'label': 'Modifier', 'type': 'secondary'},
                {'action': 'delete', 'label': 'Supprimer', 'type': 'danger'}
            ]
        elif expense.status == 'submitted':
            actions = [
                {'action': 'approve', 'label': 'Approuver', 'type': 'primary'},
                {'action': 'review', 'label': 'Mettre en révision', 'type': 'secondary'},
                {'action': 'reject', 'label': 'Rejeter', 'type': 'danger'}
            ]
        elif expense.status == 'under_review':
            actions = [
                {'action': 'approve', 'label': 'Approuver', 'type': 'primary'},
                {'action': 'reject', 'label': 'Rejeter', 'type': 'danger'},
                {'action': 'request_info', 'label': 'Demander des informations', 'type': 'secondary'}
            ]
        elif expense.status == 'approved':
            actions = [
                # Aucune action disponible pour les dépenses approuvées
                # Le statut 'approved' est maintenant le statut final
            ]
        elif expense.status == 'rejected':
            actions = [
                {'action': 'resubmit', 'label': 'Resoumettre', 'type': 'primary'},
                {'action': 'edit', 'label': 'Modifier', 'type': 'secondary'}
            ]
        
        return Response({
            'success': True,
            'expense_id': expense_id,
            'current_status': expense.status,
            'workflow_status': workflow_status,
            'available_actions': actions
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la récupération: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
