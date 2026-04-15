# CRM Dashboard Documentation

## Vue d'ensemble

Le tableau de bord CRM fournit une vue complète des performances et activités du CRM Sofixe ERP. Il permet aux utilisateurs de surveiller les indicateurs clés de performance (KPI) et d'accéder rapidement aux fonctionnalités principales.

## Fonctionnalités

### 1. Statistiques en Temps Réel

#### Cartes de Statistiques
- **Total Clients** : Nombre total de clients avec répartition active/prospects
- **Devis** : Nombre total de devis avec statuts en attente/approuvés
- **Revenu Total** : Somme des devis approuvés
- **Communications** : Nombre total d'interactions client

### 2. Activité Récente

Affiche les 5 activités les plus récentes :
- Nouveaux clients ajoutés
- Devis créés
- Communications enregistrées

Chaque activité inclut :
- Type d'activité (icône)
- Titre et description
- Statut (badge coloré)
- Date

### 3. Actions Rapides

Boutons d'accès direct aux fonctionnalités principales :
- Ajouter un nouveau client
- Créer un devis
- Enregistrer une communication
- Voir tous les clients

### 4. Métriques de Performance

#### Indicateurs Clés
- **Taux de Conversion** : Pourcentage prospects → clients actifs
- **Taux de Succès des Devis** : Pourcentage devis approuvés
- **Valeur Moyenne des Devis** : Revenu moyen par devis approuvé
- **Taux d'Engagement** : Communications par client

## Architecture Technique

### Composants

#### CRMDashboard
- Composant principal du tableau de bord
- Gère le chargement des données et l'état
- Affiche les statistiques et activités

#### Interfaces
```typescript
interface DashboardStats {
  totalClients: number
  activeClients: number
  prospectClients: number
  totalQuotes: number
  pendingQuotes: number
  approvedQuotes: number
  totalRevenue: number
  recentCommunications: number
}

interface RecentActivity {
  id: string
  type: "client" | "quote" | "communication"
  title: string
  description: string
  date: string
  status?: string
  amount?: number
}
```

### Flux de Données

1. **Chargement Initial** : Appels API simultanés pour clients, devis, communications
2. **Calcul des Statistiques** : Agrégation des données en temps réel
3. **Génération d'Activités** : Tri et limitation des activités récentes
4. **Affichage** : Mise à jour de l'interface utilisateur

### API Utilisées

- `api.clients.list()` - Liste des clients
- `api.quotes.list()` - Liste des devis
- `api.communications.list()` - Liste des communications

## Personnalisation

### Couleurs des Statuts

Les badges de statut utilisent un système de couleurs cohérent :

- **Vert** : Actif, Approuvé, Appel téléphonique
- **Jaune** : Prospect, En attente
- **Rouge** : Inactif, Rejeté
- **Bleu** : Email
- **Violet** : Réunion
- **Gris** : Par défaut

### Icônes d'Activité

- **Clients** : Icône Users
- **Devis** : Icône FileText
- **Communications** : Icône Mail
- **Par défaut** : Icône Calendar

## Gestion d'Erreurs

- Messages d'erreur spécifiques extraits des réponses API
- Indicateur de chargement pendant le traitement
- Gestion des erreurs de réseau et de validation

## Améliorations Futures

### Fonctionnalités Potentielles
1. **Filtres Temporels** : Sélection de périodes personnalisées
2. **Graphiques** : Visualisations des tendances
3. **Alertes** : Notifications pour devis expirés
4. **Export** : Export des données en CSV/PDF
5. **Widgets Personnalisables** : Réorganisation du tableau de bord

### Optimisations
1. **Mise en Cache** : Cache des données fréquemment consultées
2. **Chargement Différé** : Chargement progressif des données
3. **Mises à Jour en Temps Réel** : WebSockets pour données en temps réel

## Utilisation

### Accès
Le tableau de bord est accessible via l'onglet "Dashboard" dans la section CRM.

### Navigation
- Cliquer sur les boutons d'actions rapides pour accéder aux fonctionnalités
- Utiliser les onglets pour naviguer entre les différentes sections
- Les activités récentes fournissent un contexte sur les actions récentes

## Maintenance

### Tests
- Vérifier que toutes les API répondent correctement
- Tester avec différents jeux de données
- Valider les calculs des métriques

### Surveillance
- Performance du chargement des données
- Exactitude des calculs statistiques
- Expérience utilisateur sur différents appareils

---

**Dernière mise à jour** : 19 octobre 2025
**Version** : 1.0
