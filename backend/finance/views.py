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
from .models import Invoice, Expense, Budget, OperationRequest
from .serializers import InvoiceSerializer, ExpenseSerializer, BudgetSerializer, OperationRequestSerializer


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
                    f"{item.unit_price:.2f} GNF",
                    f"{item_total:.2f} GNF"
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
                ['Sous-total:', f"{subtotal:.2f} GNF"],
                ['TVA:', "0.00 GNF"],  # You can add tax calculation logic here
                ['TOTAL:', f"{invoice.amount:.2f} GNF"]
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
    
    @action(detail=False, methods=['get'])
    def project_summary(self, request):
        """Résumé des statistiques des dépenses pour un projet spécifique"""
        project_id = request.query_params.get('project')
        if not project_id:
            return Response({'error': 'Paramètre project requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(project_id=project_id)
        
        # Total dépensé (toutes les dépenses approuvées)
        total_depense = queryset.filter(
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Total dépensé par source de financement
        total_budget_projet = queryset.filter(
            status='approved',
            fund_source__in=['project_budget', None]
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_caisse_operations = queryset.filter(
            status='approved',
            fund_source='operation_cash'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_fonds_urgence = queryset.filter(
            status='approved',
            fund_source='emergency_fund'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Total général approuvé
        total_global = queryset.filter(
            status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'total_depense': float(total_depense),
            'total_budget_projet': float(total_budget_projet),
            'total_caisse_operations': float(total_caisse_operations),
            'total_fonds_urgence': float(total_fonds_urgence),
            'total_global': float(total_global),
            'total_count': queryset.filter(status='approved').count(),
        })

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

class OperationRequestViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des demandes d'opération"""
    queryset = OperationRequest.objects.all().select_related(
        'project', 'requester', 'validated_by'
    ).order_by('-request_date')
    serializer_class = OperationRequestSerializer

    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['task_name', 'reference', 'description']
    filterset_fields = ['status', 'project', 'period']
    ordering_fields = ['request_date', 'total_amount', 'created_at']
    
    def get_queryset(self):
        """Filtre les demandes selon l'utilisateur connecté"""
        queryset = super().get_queryset()
        
        # Si l'utilisateur n'est pas admin, ne montrer que ses demandes
        if not self.request.user.is_staff:
            queryset = queryset.filter(requester=self.request.user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Soumettre une demande pour validation"""
        operation = self.get_object()
        
        if operation.status != 'draft':
            return Response(
                {'error': 'Seules les demandes en brouillon peuvent être soumises'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # NOTE: On ne vérifie PAS le budget à la soumission
        # La vérification se fera seulement à la validation
        # Cela permet de soumettre des demandes même si le budget est insuffisant
        # Le validateur pourra alors décider d'augmenter le budget ou de rejeter
        
        # Mise à jour du statut
        operation.status = 'submitted'
        operation.save()
        
        # Log pour information (pas d'erreur)
        budget_valid, budget_message = operation.validate_budget_availability()
        if not budget_valid:
            print(f"⚠️ Opération {operation.reference} soumise avec budget insuffisant: {budget_message}")
        
        serializer = self.get_serializer(operation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        """Valider une demande d'opération"""
        operation = self.get_object()
        
        if operation.status != 'submitted':
            return Response(
                {'error': 'Seules les demandes soumises peuvent être validées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation du budget (vérification seulement, pas de déduction)
        budget_valid, budget_message = operation.validate_budget_availability()
        if not budget_valid:
            return Response(
                {'error': f'Validation budget échouée: {budget_message}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mise à jour du statut
        operation.status = 'validated'
        operation.validated_by = request.user
        # Utiliser la date fournie ou la date du jour
        from django.utils import timezone
        operation.validation_date = request.data.get('validation_date') or timezone.now().date()
        operation.save()
        
        # NOTE: La déduction du budget se fera lors du paiement, pas lors de la validation
        
        serializer = self.get_serializer(operation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        """Payer une demande d'opération validée avec justificatif"""
        operation = self.get_object()
        
        if operation.status != 'validated':
            return Response(
                {'error': 'Seules les demandes validées peuvent être payées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validation du budget avant paiement
        budget_valid, budget_message = operation.validate_budget_availability()
        if not budget_valid:
            return Response(
                {'error': f'Budget insuffisant pour le paiement: {budget_message}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gestion du fichier de justificatif
        payment_proof = request.FILES.get('payment_proof')
        if payment_proof:
            operation.payment_proof = payment_proof
        
        # Mise à jour du statut
        operation.status = 'paid'
        operation.save()
        
        # NOTE: La mise à jour de project.spent est gérée automatiquement
        # par le signal sync_project_on_operation_change dans projects/signals.py
        # qui appelle project.sync_with_finance() quand le statut passe à 'paid'
        
        serializer = self.get_serializer(operation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejeter une demande d'opération"""
        operation = self.get_object()
        
        if operation.status not in ['draft', 'submitted']:
            return Response(
                {'error': 'Seules les demandes en brouillon ou soumises peuvent être rejetées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupération de la raison du rejet
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {'error': 'La raison du rejet est obligatoire'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mise à jour du statut
        operation.status = 'rejected'
        operation.rejection_reason = rejection_reason
        operation.save()
        
        serializer = self.get_serializer(operation)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Résumé des demandes d'opération"""
        queryset = self.get_queryset()
        
        total_count = queryset.count()
        total_amount = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Par statut
        by_status = {}
        for status_code, status_name in OperationRequest.STATUS_CHOICES:
            status_queryset = queryset.filter(status=status_code)
            by_status[status_code] = {
                'name': status_name,
                'count': status_queryset.count(),
                'amount': status_queryset.aggregate(total=Sum('total_amount'))['total'] or 0
            }
        
        # Par période
        by_period = {}
        for period_code, period_name in OperationRequest.PERIOD_CHOICES:
            period_queryset = queryset.filter(period=period_code)
            by_period[period_code] = {
                'name': period_name,
                'count': period_queryset.count(),
                'amount': period_queryset.aggregate(total=Sum('total_amount'))['total'] or 0
            }
        
        return Response({
            'total_count': total_count,
            'total_amount': float(total_amount),
            'by_status': by_status,
            'by_period': by_period,
            'average_amount': float(total_amount / total_count) if total_count > 0 else 0
        })
    
    @action(detail=False, methods=['get'])
    def project_summary(self, request):
        """Résumé des statistiques des opérations pour un projet spécifique"""
        project_id = request.query_params.get('project')
        if not project_id:
            return Response({'error': 'Paramètre project requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(project_id=project_id)
        
        total_demande = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        
        total_valide = queryset.filter(
            status__in=['validated', 'paid']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        total_paye = queryset.filter(
            status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        reste_a_payer = queryset.filter(
            status__in=['validated', 'submitted']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        return Response({
            'total_demande': float(total_demande),
            'total_valide': float(total_valide),
            'total_paye': float(total_paye),
            'reste_a_payer': float(reste_a_payer),
            'total_count': queryset.count(),
            'valide_count': queryset.filter(status__in=['validated', 'paid']).count(),
            'paye_count': queryset.filter(status='paid').count(),
            'en_attente_count': queryset.filter(status__in=['validated', 'submitted']).count(),
        })
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Récupérer les demandes de l'utilisateur connecté"""
        user_requests = self.get_queryset().filter(requester=request.user)
        serializer = self.get_serializer(user_requests, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_validation(self, request):
        """Récupérer les demandes en attente de validation"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Accès non autorisé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_requests = self.get_queryset().filter(status='submitted')
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)
