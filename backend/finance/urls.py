from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, ExpenseViewSet, BudgetViewSet
from .views_workflow import (
    create_expense_workflow,
    submit_expense_for_approval,
    approve_expense,
    process_expense_payment_api,
    get_expense_workflow_status,
    get_project_expenses_summary,
    validate_expense_budget,
    get_expense_workflow_actions
)

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'budgets', BudgetViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Workflow des dépenses
    path('expenses/workflow/create/', create_expense_workflow, name='expense-workflow-create'),
    path('expenses/<int:expense_id>/workflow/submit/', submit_expense_for_approval, name='expense-workflow-submit'),
    path('expenses/<int:expense_id>/workflow/approve/', approve_expense, name='expense-workflow-approve'),
    path('expenses/<int:expense_id>/workflow/payment/', process_expense_payment_api, name='expense-workflow-payment'),
    path('expenses/<int:expense_id>/workflow/status/', get_expense_workflow_status, name='expense-workflow-status'),
    path('expenses/<int:expense_id>/workflow/actions/', get_expense_workflow_actions, name='expense-workflow-actions'),
    path('projects/<int:project_id>/expenses/summary/', get_project_expenses_summary, name='project-expenses-summary'),
    path('expenses/validate-budget/', validate_expense_budget, name='validate-expense-budget'),
]
