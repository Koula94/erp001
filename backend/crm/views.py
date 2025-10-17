from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, Quote, Communication
from .serializers import ClientSerializer, QuoteSerializer, CommunicationSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'email', 'contact_person']
    filterset_fields = ['status']
    ordering_fields = ['name', 'created_at']

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all().select_related('client', 'created_by')
    serializer_class = QuoteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['project_name', 'client__name']
    filterset_fields = ['status', 'client']
    ordering_fields = ['created_at', 'amount']

class CommunicationViewSet(viewsets.ModelViewSet):
    queryset = Communication.objects.all().select_related('client', 'user')
    serializer_class = CommunicationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['subject', 'content']
    filterset_fields = ['type', 'client']
    ordering_fields = ['date']
