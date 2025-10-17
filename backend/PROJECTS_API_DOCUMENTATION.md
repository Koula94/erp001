# Projects API Documentation

Ce document décrit l'API CRUD complète pour le module Projects de l'ERP Sofixe.

## Base URL
```
http://localhost:8000/api/projects/
```

## Authentification
Toutes les requêtes nécessitent une authentification JWT. Incluez le token dans l'en-tête :
```
Authorization: Bearer <your_token>
```

## Endpoints

### Projects

#### Liste des projets
- **URL**: `/projects/`
- **Méthode**: `GET`
- **Paramètres de recherche**:
  - `search`: Recherche dans le nom du projet et le nom du client
  - `status`: Filtre par statut
  - `manager`: Filtre par manager
  - `ordering`: Tri par `start_date`, `budget`

**Exemple de réponse**:
```json
[
  {
    "id": 1,
    "name": "Construction Résidentielle",
    "client": 1,
    "client_name": "Client Corp",
    "status": "in-progress",
    "progress": 25,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "budget": "1000000.00",
    "spent": "250000.00",
    "manager": 1,
    "manager_name": "John Doe",
    "team": [1, 2, 3],
    "team_members": [...],
    "description": "Projet de construction résidentielle",
    "tasks": [...],
    "milestones": [...],
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```

#### Créer un projet
- **URL**: `/projects/`
- **Méthode**: `POST`
- **Body**:
```json
{
  "name": "Nouveau Projet",
  "client": 1,
  "status": "planning",
  "progress": 0,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "budget": "500000.00",
  "spent": "0.00",
  "manager": 1,
  "team": [1, 2, 3],
  "description": "Description du projet"
}
```

#### Détails d'un projet
- **URL**: `/projects/{id}/`
- **Méthode**: `GET`

#### Mettre à jour un projet
- **URL**: `/projects/{id}/`
- **Méthode**: `PUT` ou `PATCH`

#### Supprimer un projet
- **URL**: `/projects/{id}/`
- **Méthode**: `DELETE`

### Tasks (Tâches)

#### Liste des tâches
- **URL**: `/tasks/`
- **Méthode**: `GET`
- **Paramètres de recherche**:
  - `search`: Recherche dans le titre
  - `status`: Filtre par statut
  - `priority`: Filtre par priorité
  - `project`: Filtre par projet
  - `assignee`: Filtre par assigné
  - `ordering`: Tri par `start_date`, `priority`

**Exemple de réponse**:
```json
[
  {
    "id": 1,
    "project": 1,
    "title": "Préparation du terrain",
    "status": "in-progress",
    "priority": "high",
    "assignee": 2,
    "assignee_name": "Jane Smith",
    "start_date": "2024-01-15",
    "end_date": "2024-02-15",
    "progress": 50,
    "description": "Excavation et préparation de la fondation"
  }
]
```

#### Créer une tâche
- **URL**: `/tasks/`
- **Méthode**: `POST`
- **Body**:
```json
{
  "project": 1,
  "title": "Nouvelle Tâche",
  "status": "pending",
  "priority": "medium",
  "assignee": 2,
  "start_date": "2024-01-15",
  "end_date": "2024-02-15",
  "progress": 0,
  "description": "Description de la tâche"
}
```

#### Détails d'une tâche
- **URL**: `/tasks/{id}/`
- **Méthode**: `GET`

#### Mettre à jour une tâche
- **URL**: `/tasks/{id}/`
- **Méthode**: `PUT` ou `PATCH`

#### Supprimer une tâche
- **URL**: `/tasks/{id}/`
- **Méthode**: `DELETE`

### Milestones (Jalons)

#### Liste des jalons
- **URL**: `/milestones/`
- **Méthode**: `GET`
- **Paramètres de recherche**:
  - `status`: Filtre par statut
  - `project`: Filtre par projet
  - `ordering`: Tri par `date`

**Exemple de réponse**:
```json
[
  {
    "id": 1,
    "project": 1,
    "title": "Fondation terminée",
    "date": "2024-02-15",
    "status": "completed",
    "description": "Travaux de fondation terminés et approuvés"
  }
]
```

#### Créer un jalon
- **URL**: `/milestones/`
- **Méthode**: `POST`
- **Body**:
```json
{
  "project": 1,
  "title": "Nouveau Jalon",
  "date": "2024-03-01",
  "status": "pending",
  "description": "Description du jalon"
}
```

#### Détails d'un jalon
- **URL**: `/milestones/{id}/`
- **Méthode**: `GET`

#### Mettre à jour un jalon
- **URL**: `/milestones/{id}/`
- **Méthode**: `PUT` ou `PATCH`

#### Supprimer un jalon
- **URL**: `/milestones/{id}/`
- **Méthode**: `DELETE`

## Modèles de données

### Project
| Champ | Type | Description |
|-------|------|-------------|
| id | Integer | ID unique |
| name | String | Nom du projet |
| client | ForeignKey | Client associé |
| status | String | Statut: planning, in-progress, on-hold, completed |
| progress | Integer | Progression (0-100) |
| start_date | Date | Date de début |
| end_date | Date | Date de fin |
| budget | Decimal | Budget total |
| spent | Decimal | Montant dépensé |
| manager | ForeignKey | Manager du projet |
| team | ManyToMany | Équipe du projet |
| description | Text | Description |
| created_at | DateTime | Date de création |

### Task
| Champ | Type | Description |
|-------|------|-------------|
| id | Integer | ID unique |
| project | ForeignKey | Projet parent |
| title | String | Titre de la tâche |
| status | String | Statut: pending, in-progress, completed |
| priority | String | Priorité: low, medium, high |
| assignee | ForeignKey | Personne assignée |
| start_date | Date | Date de début |
| end_date | Date | Date de fin |
| progress | Integer | Progression (0-100) |
| description | Text | Description |

### Milestone
| Champ | Type | Description |
|-------|------|-------------|
| id | Integer | ID unique |
| project | ForeignKey | Projet parent |
| title | String | Titre du jalon |
| date | Date | Date cible |
| status | String | Statut: pending, in-progress, completed |
| description | Text | Description |

## Exemples d'utilisation

### Créer un projet avec des tâches et jalons

```python
import requests

# Authentification
token_response = requests.post('http://localhost:8000/api/token/', {
    'username': 'votre_utilisateur',
    'password': 'votre_mot_de_passe'
})
token = token_response.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# Créer un projet
project_data = {
    'name': 'Construction Villa Moderne',
    'client': 1,
    'status': 'planning',
    'start_date': '2024-03-01',
    'end_date': '2024-12-31',
    'budget': '750000.00',
    'manager': 1,
    'description': 'Construction d\'une villa moderne avec piscine'
}
project_response = requests.post('http://localhost:8000/api/projects/projects/', 
                                json=project_data, headers=headers)
project_id = project_response.json()['id']

# Créer des tâches
tasks_data = [
    {
        'project': project_id,
        'title': 'Préparation du terrain',
        'status': 'pending',
        'priority': 'high',
        'assignee': 2,
        'start_date': '2024-03-01',
        'end_date': '2024-03-15',
        'description': 'Excavation et nivellement'
    }
]
for task_data in tasks_data:
    requests.post('http://localhost:8000/api/projects/tasks/', 
                 json=task_data, headers=headers)

# Créer des jalons
milestones_data = [
    {
        'project': project_id,
        'title': 'Fondation terminée',
        'date': '2024-04-15',
        'status': 'pending',
        'description': 'Fondation coulée et approuvée'
    }
]
for milestone_data in milestones_data:
    requests.post('http://localhost:8000/api/projects/milestones/', 
                 json=milestone_data, headers=headers)
```

### Récupérer les projets avec filtres

```python
# Projets en cours
response = requests.get('http://localhost:8000/api/projects/projects/?status=in-progress', 
                       headers=headers)

# Recherche par nom
response = requests.get('http://localhost:8000/api/projects/projects/?search=villa', 
                       headers=headers)

# Tri par budget décroissant
response = requests.get('http://localhost:8000/api/projects/projects/?ordering=-budget', 
                       headers=headers)
```

## Tests

Pour tester l'API, exécutez le script de test :
```bash
cd backend
python test_projects_api.py
```

Le script testera toutes les opérations CRUD pour les projets, tâches et jalons.
