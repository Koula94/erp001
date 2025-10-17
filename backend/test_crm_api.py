#!/usr/bin/env python
"""
Test script for CRM API endpoints
"""

import os
import sys
import django
import requests
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000/api"

def get_auth_headers():
    """Get authentication headers for API requests"""
    # Create a test user or use existing one
    User = get_user_model()
    try:
        user = User.objects.get(username="admin")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
    
    token = AccessToken.for_user(user)
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def test_clients_crud():
    """Test CRUD operations for clients"""
    headers = get_auth_headers()
    
    print("=== Testing Clients CRUD API ===")
    
    # 1. Create a new client
    print("\n1. Creating a new client...")
    client_data = {
        "name": "Test Company SA",
        "email": "contact@testcompany.com",
        "phone": "+33 1 23 45 67 89",
        "address": "123 Rue de la Test, 75001 Paris, France",
        "status": "prospect",
        "contact_person": "Jean Dupont"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/crm/clients/",
            json=client_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            client = response.json()
            print(f"✅ Client created successfully: {client['name']} (ID: {client['id']})")
            client_id = client['id']
        else:
            print(f"❌ Failed to create client: {response.text}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running.")
        return
    
    # 2. Get all clients
    print("\n2. Getting all clients...")
    response = requests.get(f"{BASE_URL}/crm/clients/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        clients = response.json()
        print(f"✅ Found {len(clients)} clients")
    else:
        print(f"❌ Failed to get clients: {response.text}")
    
    # 3. Get specific client
    print(f"\n3. Getting client {client_id}...")
    response = requests.get(f"{BASE_URL}/crm/clients/{client_id}/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        client = response.json()
        print(f"✅ Client retrieved: {client['name']}")
    else:
        print(f"❌ Failed to get client: {response.text}")
    
    # 4. Update client
    print(f"\n4. Updating client {client_id}...")
    update_data = {
        "name": "Test Company SAS",
        "email": "info@testcompany.com",
        "phone": "+33 1 23 45 67 90",
        "address": "456 Avenue du Test, 75002 Paris, France",
        "status": "active",
        "contact_person": "Marie Martin"
    }
    response = requests.put(
        f"{BASE_URL}/crm/clients/{client_id}/",
        json=update_data,
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        client = response.json()
        print(f"✅ Client updated: {client['name']} (Status: {client['status']})")
    else:
        print(f"❌ Failed to update client: {response.text}")
    
    # 5. Search clients
    print("\n5. Searching clients...")
    response = requests.get(f"{BASE_URL}/crm/clients/?search=Test", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        clients = response.json()
        print(f"✅ Found {len(clients)} clients matching 'Test'")
    else:
        print(f"❌ Failed to search clients: {response.text}")
    
    # 6. Filter clients by status
    print("\n6. Filtering clients by status...")
    response = requests.get(f"{BASE_URL}/crm/clients/?status=active", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        clients = response.json()
        print(f"✅ Found {len(clients)} active clients")
    else:
        print(f"❌ Failed to filter clients: {response.text}")
    
    # 7. Delete client
    print(f"\n7. Deleting client {client_id}...")
    response = requests.delete(f"{BASE_URL}/crm/clients/{client_id}/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 204:
        print("✅ Client deleted successfully")
    else:
        print(f"❌ Failed to delete client: {response.text}")

def test_quotes_api():
    """Test quotes API endpoints"""
    headers = get_auth_headers()
    
    print("\n=== Testing Quotes API ===")
    
    # Get all quotes
    print("\n1. Getting all quotes...")
    response = requests.get(f"{BASE_URL}/crm/quotes/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        quotes = response.json()
        print(f"✅ Found {len(quotes)} quotes")
    else:
        print(f"❌ Failed to get quotes: {response.text}")

def test_communications_api():
    """Test communications API endpoints"""
    headers = get_auth_headers()
    
    print("\n=== Testing Communications API ===")
    
    # Get all communications
    print("\n1. Getting all communications...")
    response = requests.get(f"{BASE_URL}/crm/communications/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        communications = response.json()
        print(f"✅ Found {len(communications)} communications")
    else:
        print(f"❌ Failed to get communications: {response.text}")

if __name__ == "__main__":
    print("CRM API Test Suite")
    print("=" * 50)
    
    test_clients_crud()
    test_quotes_api()
    test_communications_api()
    
    print("\n" + "=" * 50)
    print("Test suite completed!")
