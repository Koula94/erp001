# SOFIXE ERP/CRM Backend - Django REST API

## Installation

1. **Créer un environnement virtuel:**
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
\`\`\`

2. **Installer les dépendances:**
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. **Créer un fichier .env:**
\`\`\`
SECRET_KEY=your-secret-key-here
DEBUG=True
\`\`\`

4. **Effectuer les migrations:**
\`\`\`bash
python manage.py makemigrations
python manage.py migrate
\`\`\`

5. **Créer un superutilisateur:**
\`\`\`bash
python manage.py createsuperuser
\`\`\`

6. **Lancer le serveur:**
\`\`\`bash
python manage.py runserver
\`\`\`

Le backend sera accessible sur `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/token/` - Obtenir un token JWT
- `POST /api/token/refresh/` - Rafraîchir le token

### Users
- `GET /api/users/` - Liste des utilisateurs
- `POST /api/users/` - Créer un utilisateur
- `GET /api/users/{id}/` - Détails d'un utilisateur
- `PUT /api/users/{id}/` - Modifier un utilisateur
- `DELETE /api/users/{id}/` - Supprimer un utilisateur
- `GET /api/users/me/` - Profil de l'utilisateur connecté

### CRM
- `/api/crm/clients/` - Gestion des clients
- `/api/crm/quotes/` - Gestion des devis
- `/api/crm/communications/` - Gestion des communications

### Projects
- `/api/projects/projects/` - Gestion des projets
- `/api/projects/tasks/` - Gestion des tâches
- `/api/projects/milestones/` - Gestion des jalons

### HR
- `/api/hr/employees/` - Gestion des employés
- `/api/hr/payroll/` - Gestion de la paie
- `/api/hr/leave-requests/` - Gestion des congés
- `/api/hr/performance-reviews/` - Évaluations de performance

### Stock
- `/api/stock/materials/` - Gestion des matériaux
- `/api/stock/equipment/` - Gestion des équipements
- `/api/stock/transactions/` - Transactions de stock
- `/api/stock/warehouses/` - Gestion des entrepôts

### Finance
- `/api/finance/invoices/` - Gestion des factures
- `/api/finance/expenses/` - Gestion des dépenses
- `/api/finance/budgets/` - Gestion des budgets

## Admin Panel

Accédez au panel d'administration Django sur `http://localhost:8000/admin`

## Notes

- Tous les endpoints nécessitent une authentification JWT sauf `/api/token/`
- Utilisez le header: `Authorization: Bearer <token>`
- Les endpoints supportent la recherche, le filtrage et le tri
