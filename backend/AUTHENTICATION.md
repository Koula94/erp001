# Authentification Backend Sofixe ERP

Ce document décrit le système d'authentification complet implémenté pour le backend Sofixe ERP.

## Configuration

Le système utilise :
- **Django REST Framework** pour l'API
- **Simple JWT** pour l'authentification par tokens
- **Custom User Model** avec rôles personnalisés
- **Token Blacklist** pour la gestion des déconnexions

## Endpoints d'Authentification

### 1. Inscription
**POST** `/api/users/auth/register/`

```json
{
  "username": "nouvel_utilisateur",
  "email": "user@example.com",
  "password": "motdepasse123",
  "first_name": "Prénom",
  "last_name": "Nom",
  "role": "employee",
  "phone": "+33123456789",
  "position": "Développeur",
  "department": "IT"
}
```

Rôles disponibles : `admin`, `manager`, `employee`, `hr`, `stock`, `finance`

### 2. Connexion
**POST** `/api/users/auth/login/`

```json
{
  "username": "admin",
  "password": "motdepasse"
}
```

### 3. Déconnexion
**POST** `/api/users/auth/logout/`

```json
{
  "refresh_token": "token_de_rafraîchissement"
}
```

### 4. Changer le mot de passe
**POST** `/api/users/auth/change-password/`

```json
{
  "old_password": "ancien_motdepasse",
  "new_password": "nouveau_motdepasse"
}
```

### 5. Obtenir l'utilisateur courant
**GET** `/api/users/auth/me/`

### 6. Refresh Token (SimpleJWT)
**POST** `/api/token/refresh/`

```json
{
  "refresh": "token_de_rafraîchissement"
}
```

### 7. Obtenir Token (SimpleJWT)
**POST** `/api/token/`

```json
{
  "username": "admin",
  "password": "motdepasse"
}
```

## Utilisation des Tokens

Toutes les requêtes API (sauf inscription et connexion) nécessitent un token JWT dans l'en-tête :

```http
Authorization: Bearer votre_token_jwt
```

## Exemple d'utilisation avec curl

### Inscription
```bash
curl -X POST http://127.0.0.1:8000/api/users/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "employee"
  }'
```

### Connexion
```bash
curl -X POST http://127.0.0.1:8000/api/users/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

### Requête authentifiée
```bash
curl -X GET http://127.0.0.1:8000/api/users/auth/me/ \
  -H "Authorization: Bearer votre_token_jwt"
```

## Gestion des Permissions

Le système utilise les permissions par défaut de Django REST Framework :
- `IsAuthenticated` : Requiert une authentification pour toutes les vues
- Les rôles personnalisés peuvent être utilisés pour des permissions plus granulaires

## Sécurité

- Validation des mots de passe selon les standards Django
- Tokens JWT avec expiration configurable
- Blacklist des tokens pour les déconnexions
- CORS configuré pour le frontend Next.js
- Protection CSRF désactivée pour l'API (utilise JWT à la place)

## Configuration JWT

Dans `settings.py` :
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## Tests

Pour tester l'authentification :

1. Démarrer le serveur : `python manage.py runserver`
2. Utiliser les endpoints avec un client HTTP (Postman, curl, etc.)
3. Vérifier que les tokens sont correctement générés et validés
4. Tester la déconnexion avec le blacklist
