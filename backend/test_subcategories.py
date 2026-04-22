#!/usr/bin/env python
"""
Test de l'API avec sous-catégories
"""

import os
import sys
import django

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from finance.models import OperationRequest, OperationSubcategory
from finance.serializers import OperationRequestWithSubcategoriesSerializer

print('=== Test de l\'API avec sous-catégories ===')

# Récupérer une opération avec sous-catégories
operation = OperationRequest.objects.filter(subcategories__isnull=False).first()
if operation:
    print(f'Opération trouvée: {operation.reference}')
    print(f'Nombre de sous-catégories: {operation.subcategories.count()}')
    
    # Sérialiser l'opération
    serializer = OperationRequestWithSubcategoriesSerializer(operation)
    data = serializer.data
    
    print(f'\nDonnées sérialisées:')
    print(f'  Référence: {data["reference"]}')
    print(f'  Montant total: {data["total_amount"]}')
    print(f'  Sous-catégories: {len(data["subcategories"])}')
    
    for i, subcat in enumerate(data['subcategories']):
        print(f'    Sous-catégorie {i+1}: {subcat["name"]} - {subcat["amount"]} GNF')
else:
    print('Aucune opération avec sous-catégories trouvée')

# Tester aussi la création d'une nouvelle opération avec sous-catégories
print('\n=== Test de création d\'opération avec sous-catégories ===')

# Créer des données de test
test_data = {
    'task_name': 'Test opération avec sous-catégories',
    'period': 'one_time',
    'total_amount': 1500,
    'description': 'Test de création avec sous-catégories',
    'status': 'draft',
    'category': 'materials',
    'subcategories': [
        {'name': 'Matériel A', 'amount': 500},
        {'name': 'Matériel B', 'amount': 1000}
    ]
}

print(f'Données de test: {test_data}')
print('Note: Pour tester la création complète, il faudrait un contexte de requête avec utilisateur')