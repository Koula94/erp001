# Test d'Intégration Frontend-Backend

## État actuel
- ✅ Backend Django en cours d'exécution sur http://localhost:8000
- ✅ Frontend Next.js en cours d'exécution sur http://localhost:3000
- ✅ Composant sidebar corrigé pour la nouvelle structure utilisateur
- ✅ Variables d'environnement configurées

## Étapes de test

### 1. Test de connexion
1. Ouvrir http://localhost:3000/login
2. Utiliser les identifiants :
   - Username: `admin`
   - Password: [le mot de passe défini lors de la création du superutilisateur]

### 2. Vérifications après connexion
- ✅ Redirection vers `/dashboard`
- ✅ Sidebar affiche le nom de l'utilisateur
- ✅ Rôle affiché correctement
- ✅ Menu de navigation filtré selon les permissions
- ✅ Déconnexion fonctionnelle

### 3. Test de création d'utilisateur via API
```bash
curl -X POST http://localhost:8000/api/users/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@sofixe.com",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User2",
    "role": "employee"
  }'
```

### 4. Test avec le nouvel utilisateur
1. Se déconnecter
2. Se reconnecter avec :
   - Username: `testuser2`
   - Password: `TestPassword123!`

## Points à vérifier

### Frontend
- [ ] Page de connexion fonctionne
- [ ] Redirection après connexion
- [ ] Affichage du nom utilisateur dans le sidebar
- [ ] Gestion des permissions dans le menu
- [ ] Déconnexion fonctionnelle
- [ ] Persistance de session au rechargement

### Backend
- [ ] Endpoints d'authentification accessibles
- [ ] Génération de tokens JWT
- [ ] Validation des tokens
- [ ] Récupération de l'utilisateur courant
- [ ] Blacklist des tokens lors de la déconnexion

## Dépannage

### Erreurs courantes
1. **CORS Errors** - Vérifier la configuration CORS dans `backend/sofixe_erp/settings.py`
2. **Token Errors** - Vérifier les durées de vie des tokens dans les paramètres JWT
3. **User Data Mismatch** - Vérifier que l'interface User correspond au modèle Django

### Logs utiles
- Console du navigateur pour les erreurs frontend
- Terminal Django pour les erreurs backend
- Réseau dans les outils de développement pour les requêtes API

## Résultat attendu
L'authentification complète fonctionne avec :
- Connexion/déconnexion fluide
- Gestion sécurisée des sessions
- Interface utilisateur cohérente
- Intégration transparente frontend-backend
