from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Count
from .models import Invoice, Expense, Budget
from .serializers import InvoiceSerializer, ExpenseSerializer, BudgetSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('client', 'project').order_by('-created_at')
    serializer_class = InvoiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['invoice_number', 'client__name']
    filterset_fields = ['status', 'client', 'project']
    ordering_fields = ['issue_date', 'amount', 'due_date']
    
    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """Mark an invoice as paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_date = request.data.get('paid_date')
        invoice.save()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        from django.utils import timezone
        overdue_invoices = self.get_queryset().filter(
            status__in=['draft', 'sent'],
            due_date__lt=timezone.now().date()
        )
        serializer = self.get_serializer(overdue_invoices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get invoice summary statistics"""
        total_invoices = self.get_queryset().count()
        total_amount = self.get_queryset().aggregate(total=Sum('amount'))['total'] or 0
        paid_amount = self.get_queryset().filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
        overdue_count = self.get_queryset().filter(
            status__in=['draft', 'sent'],
            due_date__lt=timezone.now().date()
        ).count()
        
        return Response({
            'total_invoices': total_invoices,
            'total_amount': float(total_amount),
            'paid_amount': float(paid_amount),
            'overdue_count': overdue_count,
            'outstanding_amount': float(total_amount - paid_amount)
        })

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().select_related('project', 'submitted_by', 'approved_by').order_by('-created_at')
    serializer_class = ExpenseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['description']
    filterset_fields = ['status', 'category', 'project']
    ordering_fields = ['date', 'amount']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an expense"""
        expense = self.get_object()
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.save()
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense"""
        expense = self.get_object()
        expense.status = 'rejected'
        expense.save()
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get expenses grouped by category"""
        expenses_by_category = self.get_queryset().values('category').annotate(
            total_amount=Sum('amount'),
            count=Count('id')
        )
        return Response(expenses_by_category)

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all().select_related('project').order_by('-period_start')
    serializer_class = BudgetSerializer
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['project', 'department']
    ordering_fields = ['period_start']
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get budget overview with totals"""
        total_planned = self.get_queryset().aggregate(total=Sum('planned_amount'))['total'] or 0
        total_spent = self.get_queryset().aggregate(total=Sum('spent_amount'))['total'] or 0
        total_remaining = total_planned - total_spent
        
        return Response({
            'total_planned': float(total_planned),
            'total_spent': float(total_spent),
            'total_remaining': float(total_remaining),
            'utilization_rate': float((total_spent / total_planned) * 100) if total_planned > 0 else 0
        })
    
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """Get budgets grouped by project"""
        from django.db.models import Count
        budgets_by_project = self.get_queryset().values(
            'project__id', 'project__name'
        ).annotate(
            total_planned=Sum('planned_amount'),
            total_spent=Sum('spent_amount'),
            budget_count=Count('id')
        )
        return Response(budgets_by_project)
