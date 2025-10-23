from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, Quote, Communication, QuoteItem
from .serializers import ClientSerializer, QuoteSerializer, CommunicationSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'email', 'contact_person']
    filterset_fields = ['status']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        """
        Optimize queryset with select_related and prefetch_related
        to reduce database queries for related data
        """
        queryset = Client.objects.all()
        
        # Prefetch related quotes and communications to avoid N+1 queries
        # when accessing related data in serializers or templates
        queryset = queryset.prefetch_related('quotes', 'communications')
        
        return queryset

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['project_name', 'client__name']
    filterset_fields = ['status', 'client']
    ordering_fields = ['created_at', 'amount']
    
    def get_queryset(self):
        """
        Optimize queryset with select_related for foreign keys
        and prefetch_related for reverse relationships
        """
        queryset = Quote.objects.all()
        
        # Use select_related for foreign key relationships (one-to-one, many-to-one)
        queryset = queryset.select_related('client', 'created_by')
        
        # Use prefetch_related for reverse relationships (one-to-many, many-to-many)
        queryset = queryset.prefetch_related('items')
        
        return queryset

class CommunicationViewSet(viewsets.ModelViewSet):
    queryset = Communication.objects.all()
    serializer_class = CommunicationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['subject', 'content']
    filterset_fields = ['type', 'client']
    ordering_fields = ['date']
    
    def get_queryset(self):
        """
        Optimize queryset with select_related for foreign keys
        """
        queryset = Communication.objects.all()
        
        # Use select_related for foreign key relationships
        queryset = queryset.select_related('client', 'user')
        
        return queryset
