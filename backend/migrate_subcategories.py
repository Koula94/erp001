#!/usr/bin/env python
"""
Script pour migrer les sous-catégories existantes de l'ancien format
(chaînes séparées par des virgules dans le champ subcategory)
vers la nouvelle table OperationSubcategory.
"""

import os
import sys
import django
import json

# Configuration de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from finance.models import OperationRequest, OperationSubcategory

def parse_old_subcategory(subcategory_str):
    """
    Parse l'ancien format de sous-catégorie.
    Peut être:
    1. Une chaîne simple: "buldizer"
    2. Une liste séparée par des virgules: "buldizer, SIVE"
    3. Un JSON: '[{"name": "buldizer", "amount": 1000}, ...]'
    """
    if not subcategory_str or not subcategory_str.strip():
        return []
    
    subcategory_str = subcategory_str.strip()
    
    # Essayer de parser comme JSON d'abord
    try:
        data = json.loads(subcategory_str)
        if isinstance(data, list):
            # Format JSON avec objets name/amount
            return data
        elif isinstance(data, dict):
            # Format JSON avec un seul objet
            return [data]
    except json.JSONDecodeError:
        pass
    
    # Sinon, traiter comme chaîne séparée par des virgules
    items = []
    for item in subcategory_str.split(','):
        item = item.strip()
        if item:
            items.append({
                'name': item,
                'amount': 0  # Montant par défaut
            })
    
    return items

def migrate_subcategories():
    """Migre toutes les sous-catégories existantes"""
    print("=== Migration des sous-catégories existantes ===")
    
    # Récupérer toutes les opérations avec sous-catégories
    operations = OperationRequest.objects.exclude(subcategory='')
    total_operations = operations.count()
    
    print(f"Nombre d'opérations à migrer: {total_operations}")
    
    migrated_count = 0
    subcategory_count = 0
    
    for operation in operations:
        print(f"\n--- Migration de l'opération {operation.reference} (ID: {operation.id}) ---")
        print(f"Ancienne sous-catégorie: {operation.subcategory}")
        
        # Parser l'ancien format
        subcategory_items = parse_old_subcategory(operation.subcategory)
        
        if not subcategory_items:
            print("  Aucune sous-catégorie valide trouvée")
            continue
        
        print(f"  {len(subcategory_items)} sous-catégorie(s) trouvée(s)")
        
        # Créer les nouvelles sous-catégories
        for i, item in enumerate(subcategory_items):
            name = item.get('name', f'Sous-catégorie {i+1}')
            amount = item.get('amount', 0)
            
            # Créer l'enregistrement dans la nouvelle table
            OperationSubcategory.objects.create(
                operation_request=operation,
                name=name,
                amount=amount
            )
            subcategory_count += 1
            print(f"  ✓ Créée: {name} - {amount} GNF")
        
        migrated_count += 1
    
    print(f"\n=== Migration terminée ===")
    print(f"Opérations migrées: {migrated_count}/{total_operations}")
    print(f"Sous-catégories créées: {subcategory_count}")
    
    # Vérification
    total_subcategories = OperationSubcategory.objects.count()
    print(f"Total sous-catégories dans la base: {total_subcategories}")

if __name__ == '__main__':
    migrate_subcategories()