import os
import django
import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from stock.models import Material, Equipment, StockTransaction, Warehouse
from projects.models import Project

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

class StockAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test warehouse
        self.warehouse = Warehouse.objects.create(
            name="Main Warehouse",
            location="123 Main St, City",
            capacity=1000,
            occupied=200,
            manager="John Doe",
            categories=["Building Materials", "Electrical"]
        )
        
        # Create test material
        self.material = Material.objects.create(
            name="Concrete",
            category="Building Materials",
            quantity=100,
            unit="kg",
            min_stock=50,
            max_stock=500,
            unit_price=10.50,
            location="A1",
            supplier="Concrete Co.",
            last_restocked="2024-01-15",
            status="in-stock"
        )
        
        # Create test equipment (without project assignment)
        self.equipment = Equipment.objects.create(
            name="Excavator",
            category="Heavy Machinery",
            status="available",
            condition="good",
            location="Yard",
            assigned_to=None,
            purchase_date="2023-05-10",
            last_maintenance="2024-01-10",
            next_maintenance="2024-04-10",
            value=50000.00
        )
        
        # Create test transaction
        self.transaction = StockTransaction.objects.create(
            type="in",
            material=self.material,
            quantity=50,
            reference="PO-2024-001",
            notes="Initial stock"
        )

    def test_materials_list(self):
        """Test retrieving materials list"""
        response = self.client.get('/api/stock/materials/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Concrete')

    def test_material_create(self):
        """Test creating a new material"""
        data = {
            'name': 'Steel Beams',
            'category': 'Building Materials',
            'quantity': 20,
            'unit': 'pcs',
            'min_stock': 10,
            'max_stock': 100,
            'unit_price': 150.00,
            'location': 'B2',
            'supplier': 'Steel Works',
            'last_restocked': '2024-01-20',
            'status': 'in-stock'
        }
        response = self.client.post('/api/stock/materials/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Material.objects.count(), 2)
        self.assertEqual(response.data['name'], 'Steel Beams')

    def test_material_update(self):
        """Test updating a material"""
        data = {'quantity': 150}
        response = self.client.patch(f'/api/stock/materials/{self.material.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.material.refresh_from_db()
        self.assertEqual(self.material.quantity, 150)

    def test_material_delete(self):
        """Test deleting a material"""
        response = self.client.delete(f'/api/stock/materials/{self.material.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Material.objects.count(), 0)

    def test_equipment_list(self):
        """Test retrieving equipment list"""
        response = self.client.get('/api/stock/equipment/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Excavator')

    def test_equipment_create(self):
        """Test creating new equipment"""
        data = {
            'name': 'Crane',
            'category': 'Heavy Machinery',
            'status': 'available',
            'condition': 'excellent',
            'location': 'Yard',
            'assigned_to': None,
            'purchase_date': '2023-08-15',
            'last_maintenance': '2024-01-15',
            'next_maintenance': '2024-04-15',
            'value': 75000.00
        }
        response = self.client.post('/api/stock/equipment/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Equipment.objects.count(), 2)
        self.assertEqual(response.data['name'], 'Crane')

    def test_warehouse_list(self):
        """Test retrieving warehouses list"""
        response = self.client.get('/api/stock/warehouses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Main Warehouse')

    def test_warehouse_create(self):
        """Test creating a new warehouse"""
        data = {
            'name': 'Secondary Warehouse',
            'location': '456 Oak St, City',
            'capacity': 500,
            'occupied': 50,
            'manager': 'Jane Smith',
            'categories': ['Tools', 'Safety']
        }
        response = self.client.post('/api/stock/warehouses/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Warehouse.objects.count(), 2)
        self.assertEqual(response.data['name'], 'Secondary Warehouse')

    def test_transactions_list(self):
        """Test retrieving transactions list"""
        response = self.client.get('/api/stock/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['type'], 'in')

    def test_transaction_create(self):
        """Test creating a new transaction"""
        data = {
            'type': 'out',
            'material': self.material.id,
            'quantity': 25,
            'reference': 'PROJ-001',
            'notes': 'Used for construction'
        }
        response = self.client.post('/api/stock/transactions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockTransaction.objects.count(), 2)
        self.assertEqual(response.data['type'], 'out')

    def test_material_search(self):
        """Test material search functionality"""
        response = self.client.get('/api/stock/materials/?search=concrete')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Concrete')

    def test_equipment_filter(self):
        """Test equipment filtering"""
        response = self.client.get('/api/stock/equipment/?status=available')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle paginated response
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Excavator')

    def test_material_total_value_calculation(self):
        """Test material total value calculation"""
        response = self.client.get(f'/api/stock/materials/{self.material.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_total = self.material.quantity * self.material.unit_price
        self.assertEqual(float(response.data['total_value']), float(expected_total))

if __name__ == '__main__':
    import unittest
    unittest.main()
