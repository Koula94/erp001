#!/usr/bin/env python
"""
Script to populate the finance module with sample data
"""

import os
import sys
import django
from django.utils import timezone
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from finance.models import Invoice, Expense, Budget
from crm.models import Client
from projects.models import Project
from users.models import User

def create_sample_data():
    """Create sample finance data"""
    
    # Get or create sample client
    client, _ = Client.objects.get_or_create(
        name="ABC Construction Ltd.",
        defaults={
            'email': 'contact@abcconstruction.com',
            'phone': '+1 (555) 123-4567',
            'address': '123 Main St, New York, NY 10001',
            'status': 'active'
        }
    )
    
    # Get or create sample project
    project, _ = Project.objects.get_or_create(
        name="Villa Construction - Phase 1",
        defaults={
            'client': client,
            'status': 'in-progress',
            'start_date': timezone.now().date() - timedelta(days=30),
            'end_date': timezone.now().date() + timedelta(days=150),
            'budget': 450000,
            'description': 'Luxury villa construction project'
        }
    )
    
    # Get admin user
    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        print("No admin user found. Please create an admin user first.")
        return
    
    # Create sample invoices
    invoices_data = [
        {
            'invoice_number': 'INV-2024-001',
            'client': client,
            'project': project,
            'amount': 125000,
            'status': 'paid',
            'issue_date': timezone.now().date() - timedelta(days=45),
            'due_date': timezone.now().date() - timedelta(days=15),
            'paid_date': timezone.now().date() - timedelta(days=10),
            'notes': 'Initial payment for foundation work'
        },
        {
            'invoice_number': 'INV-2024-002',
            'client': client,
            'project': project,
            'amount': 85000,
            'status': 'sent',
            'issue_date': timezone.now().date() - timedelta(days=15),
            'due_date': timezone.now().date() + timedelta(days=15),
            'notes': 'Structural framework work'
        },
        {
            'invoice_number': 'INV-2024-003',
            'client': client,
            'project': project,
            'amount': 95000,
            'status': 'draft',
            'issue_date': timezone.now().date(),
            'due_date': timezone.now().date() + timedelta(days=30),
            'notes': 'Electrical installation work'
        }
    ]
    
    for invoice_data in invoices_data:
        invoice, created = Invoice.objects.get_or_create(
            invoice_number=invoice_data['invoice_number'],
            defaults=invoice_data
        )
        if created:
            print(f"Created invoice: {invoice.invoice_number}")
    
    # Create sample expenses
    expenses_data = [
        {
            'description': 'Cement purchase - 200 bags',
            'category': 'materials',
            'amount': 2500,
            'date': timezone.now().date() - timedelta(days=40),
            'project': project,
            'submitted_by': admin_user,
            'status': 'approved'
        },
        {
            'description': 'Steel rebar delivery',
            'category': 'materials',
            'amount': 8500,
            'date': timezone.now().date() - timedelta(days=35),
            'project': project,
            'submitted_by': admin_user,
            'status': 'approved'
        },
        {
            'description': 'Equipment rental - Excavator',
            'category': 'equipment',
            'amount': 3500,
            'date': timezone.now().date() - timedelta(days=25),
            'project': project,
            'submitted_by': admin_user,
            'status': 'pending'
        },
        {
            'description': 'Labor costs - Foundation team',
            'category': 'labor',
            'amount': 12500,
            'date': timezone.now().date() - timedelta(days=20),
            'project': project,
            'submitted_by': admin_user,
            'status': 'approved'
        }
    ]
    
    for expense_data in expenses_data:
        # Check if expense already exists
        existing = Expense.objects.filter(
            description=expense_data['description'],
            date=expense_data['date']
        ).exists()
        
        if not existing:
            expense = Expense.objects.create(**expense_data)
            print(f"Created expense: {expense.description}")
    
    # Create sample budgets
    budgets_data = [
        {
            'category': 'Materials',
            'planned_amount': 50000,
            'spent_amount': 11000,
            'period_start': timezone.now().date().replace(month=1, day=1),
            'period_end': timezone.now().date().replace(month=3, day=31),
            'project': project
        },
        {
            'category': 'Labor',
            'planned_amount': 75000,
            'spent_amount': 12500,
            'period_start': timezone.now().date().replace(month=1, day=1),
            'period_end': timezone.now().date().replace(month=3, day=31),
            'project': project
        },
        {
            'category': 'Equipment',
            'planned_amount': 25000,
            'spent_amount': 3500,
            'period_start': timezone.now().date().replace(month=1, day=1),
            'period_end': timezone.now().date().replace(month=3, day=31),
            'project': project
        }
    ]
    
    for budget_data in budgets_data:
        # Check if budget already exists
        existing = Budget.objects.filter(
            category=budget_data['category'],
            period_start=budget_data['period_start'],
            period_end=budget_data['period_end']
        ).exists()
        
        if not existing:
            budget = Budget.objects.create(**budget_data)
            print(f"Created budget: {budget.category}")
    
    print("\nFinance data population completed!")
    print(f"Total invoices: {Invoice.objects.count()}")
    print(f"Total expenses: {Expense.objects.count()}")
    print(f"Total budgets: {Budget.objects.count()}")

if __name__ == '__main__':
    create_sample_data()
