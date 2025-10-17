# Authentification Frontend Sofixe ERP

Ce document explique comment l'authentification frontend est maintenant liée avec le backend Django.

## Configuration

### Variables d'environnement
Le fichier `.env.local` contient :
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Structure mise à jour

1. **lib/auth.ts** - Types et interfaces mis à jour
2. **contexts/auth-context.tsx** - Contexte d'authentification avec backend
3. **app/login/page.tsx** - Page de connexion mise à jour
4. **lib/api.ts** - Client API existant (déjà configuré)

## Fonctionnalités implémentées

### 1. Connexion avec le backend
- Utilise les endpoints d'authentification personnalisés du backend
- Stocke les tokens JWT dans le localStorage
- Gère le rafraîchissement automatique des tokens
- Vérifie la validité des tokens au chargement

### 2. Gestion des sessions
- Persistance de la session utilisateur
- Récupération automatique de l'utilisateur connecté
- Déconnexion avec blacklist des tokens

### 3. Compatibilité avec l'API existante
- Utilise le client API existant pour les autres endpoints
- Gestion automatique des en-têtes d'autorisation

## Comment tester l'intégration

### Prérequis
1. Backend Django en cours d'exécution sur http://localhost:8000
2. Frontend Next.js en cours d'exécution sur http://localhost:3000

### Étapes de test

1. **Accéder à la page de connexion**
   - Ouvrir http://localhost:3000/login

2. **Utiliser un compte existant**
   - Username: `admin` (superutilisateur créé)
   - Password: Le mot de passe que vous avez défini

3. **Créer un nouvel utilisateur via l'API**
   ```bash
   curl -X POST http://localhost:8000/api/users/auth/register/ \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@sofixe.com",
       "password": "TestPassword123!",
       "first_name": "Test",
       "last_name": "User",
       "role": "employee"
     }'
   ```

4. **Se connecter avec le nouvel utilisateur**
   - Username: `testuser`
   - Password: `TestPassword123!`

### Points de vérification

- ✅ La connexion redirige vers `/dashboard`
- ✅ Les tokens sont stockés dans le localStorage
- ✅ L'utilisateur est correctement affiché dans l'interface
- ✅ La déconnexion fonctionne et supprime les tokens
- ✅ Les autres pages nécessitent une authentification

## Dépannage

### Erreurs courantes

1. **CORS Errors**
   - Vérifier que le backend autorise http://localhost:3000
   - Vérifier la configuration CORS dans `backend/sofixe_erp/settings.py`

2. **Token Expired**
   - Le système devrait rafraîchir automatiquement les tokens
   - Vérifier les durées de vie dans les paramètres JWT

3. **API Connection Failed**
   - Vérifier que le backend est en cours d'exécution
   - Vérifier l'URL dans `.env.local`

### Logs de débogage

Les erreurs sont consignées dans la console du navigateur :
- Échec de connexion
- Erreurs de token
- Problèmes de réseau

## Sécurité

- Les tokens sont stockés dans le localStorage (standard pour les SPA)
- Les tokens ont une durée de vie limitée
- Le rafraîchissement automatique gère les sessions expirées
- La déconnexion blacklist les tokens côté serveur

## Prochaines étapes

1. **Gestion des erreurs utilisateur** - Messages d'erreur plus détaillés
2. **Inscription frontend** - Formulaire d'inscription dans l'interface
3. **Récupération de mot de passe** - Fonctionnalité "mot de passe oublié"
4. **Profil utilisateur** - Édition du profil et changement de mot de passe
