from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from finance.models import Invoice, InvoiceItem, Expense, Budget
from crm.models import Client
from projects.models import Project

User = get_user_model()

class FinanceAPITestCase(APITestCase):
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        
        # Create test client
        self.client_obj = Client.objects.create(
            name='Test Client',
            email='client@example.com',
            phone='+1234567890',
            address='123 Test Street'
        )
        
        # Create test project
        self.project = Project.objects.create(
            name='Test Project',
            client=self.client_obj,
            description='Test project description',
            status='planning',
            start_date='2024-01-01',
            end_date='2024-12-31',
            budget=10000.00,
            manager=self.admin_user
        )
        
        # Create test invoice
        self.invoice = Invoice.objects.create(
            client=self.client_obj,
            project=self.project,
            invoice_number='INV-001',
            amount=1000.00,
            status='draft',
            issue_date='2024-01-01',
            due_date='2024-02-01'
        )
        
        # Create test invoice items
        self.invoice_item = InvoiceItem.objects.create(
            invoice=self.invoice,
            description='Test Service',
            quantity=2,
            unit_price=500.00,
            total=1000.00
        )
        
        # Create test expense
        self.expense = Expense.objects.create(
            project=self.project,
            category='materials',
            amount=250.00,
            description='Test materials purchase',
            date='2024-01-15',
            submitted_by=self.user
        )
        
        # Create test budget
        self.budget = Budget.objects.create(
            project=self.project,
            category='Development',
            planned_amount=5000.00,
            spent_amount=1250.00,
            period_start='2024-01-01',
            period_end='2024-12-31'
        )
        
        # Authenticate as admin user for all tests
        self.client.force_authenticate(user=self.admin_user)

class InvoiceAPITests(FinanceAPITestCase):
    def test_list_invoices(self):
        """Test listing all invoices"""
        url = reverse('invoice-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['invoice_number'], 'INV-001')

    def test_create_invoice(self):
        """Test creating a new invoice"""
        url = reverse('invoice-list')
        data = {
            'client': self.client_obj.id,
            'project': self.project.id,
            'invoice_number': 'INV-002',
            'amount': 1500.00,
            'status': 'draft',
            'issue_date': '2024-01-02',
            'due_date': '2024-02-02',
            'items': [
                {
                    'description': 'New Service',
                    'quantity': 3,
                    'unitPrice': 500.00
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Invoice.objects.count(), 2)
        self.assertEqual(InvoiceItem.objects.count(), 2)

    def test_retrieve_invoice(self):
        """Test retrieving a specific invoice"""
        url = reverse('invoice-detail', args=[self.invoice.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['invoice_number'], 'INV-001')

    def test_update_invoice(self):
        """Test updating an invoice"""
        url = reverse('invoice-detail', args=[self.invoice.id])
        data = {
            'status': 'sent',
            'amount': 1200.00
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'sent')
        self.assertEqual(self.invoice.amount, 1200.00)

    def test_delete_invoice(self):
        """Test deleting an invoice"""
        url = reverse('invoice-detail', args=[self.invoice.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Invoice.objects.count(), 0)

class ExpenseAPITests(FinanceAPITestCase):
    def test_list_expenses(self):
        """Test listing all expenses"""
        url = reverse('expense-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['description'], 'Test materials purchase')

    def test_create_expense(self):
        """Test creating a new expense"""
        url = reverse('expense-list')
        data = {
            'project': self.project.id,
            'category': 'labor',
            'amount': 350.00,
            'description': 'Test labor expense',
            'date': '2024-01-20',
            'submitted_by': self.user.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 2)

    def test_retrieve_expense(self):
        """Test retrieving a specific expense"""
        url = reverse('expense-detail', args=[self.expense.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Test materials purchase')

    def test_update_expense(self):
        """Test updating an expense"""
        url = reverse('expense-detail', args=[self.expense.id])
        data = {
            'status': 'approved',
            'approved_by': self.admin_user.id
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.expense.refresh_from_db()
        self.assertEqual(self.expense.status, 'approved')
        self.assertEqual(self.expense.approved_by, self.admin_user)

    def test_delete_expense(self):
        """Test deleting an expense"""
        url = reverse('expense-detail', args=[self.expense.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Expense.objects.count(), 0)

class BudgetAPITests(FinanceAPITestCase):
    def test_list_budgets(self):
        """Test listing all budgets"""
        url = reverse('budget-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['category'], 'Development')

    def test_create_budget(self):
        """Test creating a new budget"""
        url = reverse('budget-list')
        data = {
            'project': self.project.id,
            'category': 'Marketing',
            'planned_amount': 3000.00,
            'spent_amount': 500.00,
            'period_start': '2024-01-01',
            'period_end': '2024-06-30'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Budget.objects.count(), 2)

    def test_retrieve_budget(self):
        """Test retrieving a specific budget"""
        url = reverse('budget-detail', args=[self.budget.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['category'], 'Development')

    def test_update_budget(self):
        """Test updating a budget"""
        url = reverse('budget-detail', args=[self.budget.id])
        data = {
            'spent_amount': 2000.00
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.budget.refresh_from_db()
        self.assertEqual(self.budget.spent_amount, 2000.00)
        self.assertEqual(self.budget.remaining, 3000.00)  # 5000 - 2000

    def test_delete_budget(self):
        """Test deleting a budget"""
        url = reverse('budget-detail', args=[self.budget.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Budget.objects.count(), 0)

class FinanceFilterTests(FinanceAPITestCase):
    def test_filter_invoices_by_status(self):
        """Test filtering invoices by status"""
        url = reverse('invoice-list') + '?status=draft'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'draft')

    def test_filter_expenses_by_category(self):
        """Test filtering expenses by category"""
        url = reverse('expense-list') + '?category=materials'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['category'], 'materials')

    def test_search_invoices(self):
        """Test searching invoices"""
        url = reverse('invoice-list') + '?search=INV-001'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['invoice_number'], 'INV-001')
