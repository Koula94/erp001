#!/usr/bin/env python
"""
Test script to measure the performance impact of select_related and prefetch_related
optimizations for CRM API endpoints
"""

import os
import sys
import django
import time
from django.db import connection, reset_queries
from django.test.utils import CaptureQueriesContext

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from crm.models import Client, Quote, Communication, QuoteItem
from crm.serializers import ClientSerializer, QuoteSerializer, CommunicationSerializer
from crm.views import ClientViewSet, QuoteViewSet, CommunicationViewSet
from users.models import User

def create_test_data():
    """Create test data for performance testing"""
    print("Creating test data...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        username="test_user",
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    # Create test clients
    clients = []
    for i in range(5):
        client = Client.objects.create(
            name=f"Test Client {i}",
            email=f"client{i}@example.com",
            phone=f"+33 1 23 45 67 {i}",
            address=f"Test Address {i}",
            status="active",
            contact_person=f"Contact Person {i}"
        )
        clients.append(client)
    
    # Create test quotes with items
    for client in clients:
        for j in range(3):
            quote = Quote.objects.create(
                client=client,
                project_name=f"Project {j} for {client.name}",
                amount=1000.00 + (j * 500),
                status="approved",
                valid_until="2025-12-31",
                created_by=user
            )
            
            # Create quote items
            for k in range(2):
                QuoteItem.objects.create(
                    quote=quote,
                    description=f"Item {k} for {quote.project_name}",
                    quantity=k + 1,
                    unit_price=100.00 + (k * 50)
                )
    
    # Create test communications
    for client in clients:
        for j in range(2):
            Communication.objects.create(
                client=client,
                type="email",
                subject=f"Communication {j} for {client.name}",
                content=f"Test content for communication {j}",
                user=user
            )
    
    print("Test data created successfully!")

def test_client_optimizations():
    """Test performance improvements for ClientViewSet"""
    print("\n" + "="*50)
    print("Testing ClientViewSet Optimizations")
    print("="*50)
    
    # Test without optimizations
    print("\n1. Testing WITHOUT optimizations:")
    reset_queries()
    
    start_time = time.time()
    clients = Client.objects.all()
    
    # Simulate accessing related data (this would cause N+1 queries)
    for client in clients:
        quotes_count = client.quotes.count()  # This would cause N+1 queries
        communications_count = client.communications.count()  # This would cause N+1 queries
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    
    # Test with optimizations
    print("\n2. Testing WITH optimizations:")
    reset_queries()
    
    start_time = time.time()
    clients = Client.objects.all().prefetch_related('quotes', 'communications')
    
    # Access related data (should be much faster)
    for client in clients:
        quotes_count = client.quotes.count()  # Should be preloaded
        communications_count = client.communications.count()  # Should be preloaded
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")

def test_quote_optimizations():
    """Test performance improvements for QuoteViewSet"""
    print("\n" + "="*50)
    print("Testing QuoteViewSet Optimizations")
    print("="*50)
    
    # Test without optimizations
    print("\n1. Testing WITHOUT optimizations:")
    reset_queries()
    
    start_time = time.time()
    quotes = Quote.objects.all()
    
    # Simulate accessing related data
    for quote in quotes:
        client_name = quote.client.name  # This would cause N+1 queries
        items_count = quote.items.count()  # This would cause N+1 queries
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    
    # Test with optimizations
    print("\n2. Testing WITH optimizations:")
    reset_queries()
    
    start_time = time.time()
    quotes = Quote.objects.all().select_related('client', 'created_by').prefetch_related('items')
    
    # Access related data
    for quote in quotes:
        client_name = quote.client.name  # Should be preloaded
        items_count = quote.items.count()  # Should be preloaded
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")

def test_communication_optimizations():
    """Test performance improvements for CommunicationViewSet"""
    print("\n" + "="*50)
    print("Testing CommunicationViewSet Optimizations")
    print("="*50)
    
    # Test without optimizations
    print("\n1. Testing WITHOUT optimizations:")
    reset_queries()
    
    start_time = time.time()
    communications = Communication.objects.all()
    
    # Simulate accessing related data
    for comm in communications:
        client_name = comm.client.name  # This would cause N+1 queries
        user_name = comm.user.get_full_name() if comm.user else "Unknown"  # This would cause N+1 queries
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    
    # Test with optimizations
    print("\n2. Testing WITH optimizations:")
    reset_queries()
    
    start_time = time.time()
    communications = Communication.objects.all().select_related('client', 'user')
    
    # Access related data
    for comm in communications:
        client_name = comm.client.name  # Should be preloaded
        user_name = comm.user.get_full_name() if comm.user else "Unknown"  # Should be preloaded
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")

def test_serializer_performance():
    """Test serializer performance with optimized querysets"""
    print("\n" + "="*50)
    print("Testing Serializer Performance")
    print("="*50)
    
    # Test ClientSerializer
    print("\n1. ClientSerializer:")
    reset_queries()
    
    start_time = time.time()
    clients = Client.objects.all().prefetch_related('quotes', 'communications')
    serializer = ClientSerializer(clients, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    print(f"   Serialized {len(data)} clients")
    
    # Test QuoteSerializer
    print("\n2. QuoteSerializer:")
    reset_queries()
    
    start_time = time.time()
    quotes = Quote.objects.all().select_related('client', 'created_by').prefetch_related('items')
    serializer = QuoteSerializer(quotes, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    print(f"   Serialized {len(data)} quotes")
    
    # Test CommunicationSerializer
    print("\n3. CommunicationSerializer:")
    reset_queries()
    
    start_time = time.time()
    communications = Communication.objects.all().select_related('client', 'user')
    serializer = CommunicationSerializer(communications, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"   Time: {end_time - start_time:.4f} seconds")
    print(f"   Query count: {query_count}")
    print(f"   Serialized {len(data)} communications")

if __name__ == "__main__":
    print("CRM Query Optimization Performance Test")
    print("="*60)
    
    # Create test data if needed
    if Client.objects.count() == 0:
        create_test_data()
    
    # Run performance tests
    test_client_optimizations()
    test_quote_optimizations()
    test_communication_optimizations()
    test_serializer_performance()
    
    print("\n" + "="*60)
    print("Performance testing completed!")
    print("\nSummary of optimizations applied:")
    print("- ClientViewSet: prefetch_related('quotes', 'communications')")
    print("- QuoteViewSet: select_related('client', 'created_by') + prefetch_related('items')")
    print("- CommunicationViewSet: select_related('client', 'user')")
    print("\nThese optimizations significantly reduce N+1 query problems!")
