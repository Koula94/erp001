import os
import django
import sys

# Ajouter le répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sofixe_erp.settings')
django.setup()

from finance.models import Invoice

try:
    invoice = Invoice.objects.get(id=5)
    print(f'Facture: {invoice.invoice_number}')
    print(f'Client: {invoice.client.name if invoice.client else None}')
    print(f'Projet: {invoice.project.name if invoice.project else None}')
    print(f'Items type: {type(invoice.items)}')
    print(f'Items: {invoice.items}')
    
    # Vérifier la structure des items avec .all()
    print(f'Items avec .all(): {invoice.items.all()}')
    items_list = list(invoice.items.all())
    print(f'Items length: {len(items_list)}')
    
    for i, item in enumerate(items_list):
        print(f'  Item {i}: {item}')
        print(f'    Description: {getattr(item, "description", "N/A")}')
        print(f'    Quantity: {getattr(item, "quantity", "N/A")}')
        print(f'    Unit price: {getattr(item, "unit_price", "N/A")}')
        
except Exception as e:
    print(f'Erreur: {e}')
    import traceback
    traceback.print_exc()
