"""
Vues API pour le workflow des dépenses
Exposition des fonctionnalités workflow au frontend
"""

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
    process_expense_approval,
    process_expense_payment
)
from projects.models import Project

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_expense_workflow(request):
    """Création d'une dépense avec workflow complet"""
    try:
        data = request.data.copy()
        
        # Ajout de l'utilisateur connecté comme créateur
        data['submitted_by'] = request.user.id
        
        # Validation des données requises
        required_fields = ['description', 'category', 'amount', 'date', 'project']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Champ manquant: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Récupération de l'instance du projet
        try:
            project = Project.objects.get(id=data['project'])
            data['project'] = project.id  # Garder l'ID pour la création
        except Project.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Projet avec ID {data["project"]} non trouvé'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Création avec workflow
        result = create_expense_with_workflow(data, request.user)
        
        if result['success']:
            return Response({
                'success': True,
                'expense': {
                    'id': result['expense'].id,
                    'description': result['expense'].description,
                    'amount': float(result['expense'].amount),
                    'category': result['expense'].category,
                    'status': result['expense'].status,
                    'project': result['expense'].project.id if result['expense'].project else None
                },
                'warnings': result.get('warnings', []),
                'notifications': result.get('notifications', [])
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Erreur lors de la création: {str(e)}'
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_expense_payment_api(request, expense_id):
    """Traitement du paiement d'une dépense"""
    try:
        payment_date = request.data.get('payment_date')
        
        result = process_expense_payment(expense_id, request.user, payment_date)
        
        if result['success']:
            return Response({
                'success': True,
                'expense': {
                    'id': result['expense'].id,
                    'status': result['expense'].status,
                    'paid_by': result['expense'].paid_by.username if result['expense'].paid_by else None,
                    'payment_date': result['expense'].payment_date
                },
                'cash_flow_updated': result.get('cash_flow_updated', False),
                'reconciled': result.get('reconciled', False),
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
            'error': f'Erreur lors du paiement: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                {'action': 'process_payment', 'label': 'Traiter le paiement', 'type': 'primary'},
                {'action': 'hold_payment', 'label': 'Mettre en attente', 'type': 'secondary'}
            ]
        elif expense.status == 'rejected':
            actions = [
                {'action': 'resubmit', 'label': 'Resoumettre', 'type': 'primary'},
                {'action': 'edit', 'label': 'Modifier', 'type': 'secondary'}
            ]
        elif expense.status == 'paid':
            actions = [
                {'action': 'view_receipt', 'label': 'Voir le reçu', 'type': 'secondary'},
                {'action': 'download_report', 'label': 'Télécharger rapport', 'type': 'secondary'}
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
