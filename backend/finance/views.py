from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Count
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime
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
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download invoice as PDF"""
        try:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Starting PDF generation for invoice {pk}")
            
            invoice = self.get_object()
            logger.info(f"Invoice found: {invoice.invoice_number}")
            
            # Create the HttpResponse object with the appropriate PDF headers
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            
            # Create the PDF object, using the response object as its "file"
            doc = SimpleDocTemplate(response, pagesize=A4)
            
            # Container for the 'Flowable' objects
            elements = []
            
            # Get styles
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=30,
                alignment=1,  # Center alignment
            )
            title = Paragraph(f"FACTURE N° {invoice.invoice_number}", title_style)
            elements.append(title)
            
            # Company and client info
            company_info = [
                ["Sofixe ERP", f"Client: {invoice.client.name if invoice.client else 'N/A'}"],
                ["123 Rue de l'Entreprise", f"Projet: {invoice.project.name if invoice.project else 'N/A'}"],
                ["75001 Paris, France", f"Statut: {invoice.status.upper()}"],
                ["Tél: +33 1 23 45 67 89", f"Date d'émission: {invoice.issue_date or 'N/A'}"],
                ["Email: contact@sofixe.com", f"Date d'échéance: {invoice.due_date}"],
            ]
            
            company_table = Table(company_info, colWidths=[3*inch, 3*inch])
            company_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('BACKGROUND', (1, 0), (1, -1), colors.whitesmoke),
            ]))
            elements.append(company_table)
            elements.append(Spacer(1, 20))
            
            # Items table
            items_data = [['Description', 'Quantité', 'Prix unitaire', 'Total']]
            subtotal = 0
            
            for item in invoice.items.all():
                item_total = item.quantity * item.unit_price
                subtotal += item_total
                items_data.append([
                    item.description,
                    str(item.quantity),
                    f"{item.unit_price:.2f} €",
                    f"{item_total:.2f} €"
                ])
            
            items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
            items_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(items_table)
            elements.append(Spacer(1, 20))
            
            # Totals
            totals_data = [
                ['Sous-total:', f"{subtotal:.2f} €"],
                ['TVA:', "0.00 €"],  # You can add tax calculation logic here
                ['TOTAL:', f"{invoice.amount:.2f} €"]
            ]
            
            totals_table = Table(totals_data, colWidths=[4*inch, 2*inch])
            totals_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
                ('TOPPADDING', (0, -1), (-1, -1), 12),
            ]))
            elements.append(totals_table)
            
            # Notes
            if invoice.notes:
                elements.append(Spacer(1, 20))
                notes_title = Paragraph("NOTES", styles['Heading2'])
                elements.append(notes_title)
                notes_text = Paragraph(invoice.notes, styles['Normal'])
                elements.append(notes_text)
            
            # Footer
            elements.append(Spacer(1, 40))
            footer = Paragraph(
                "Sofixe ERP - Système de gestion d'entreprise<br/>"
                "Cette facture a été générée automatiquement par le système Sofixe ERP",
                ParagraphStyle(
                    'Footer',
                    parent=styles['Normal'],
                    fontSize=8,
                    textColor=colors.grey,
                    alignment=1,  # Center alignment
                )
            )
            elements.append(footer)
            
            # Build PDF
            doc.build(elements)
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview invoice details"""
        invoice = self.get_object()
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

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
