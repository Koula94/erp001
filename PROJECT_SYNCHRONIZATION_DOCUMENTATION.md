# Synchronisation Automatique Projets-Tâches

## Vue d'ensemble

Ce système permet la synchronisation automatique entre les projets et leurs tâches, garantissant une cohérence parfaite des statuts, de la progression et des alertes en temps réel.

## Fonctionnalités principales

### 1. Synchronisation des Statuts

**Règles automatiques :**
- **Projet → "en cours"** : Si au moins une tâche est démarrée
- **Projet → "terminé"** : Si toutes les tâches sont terminées
- **Projet → "en attente"** : Si plus de 30% des tâches sont critiques
- **Réactivation automatique** : Si toutes les tâches critiques sont résolues

### 2. Calcul de Progression

**Deux méthodes de calcul :**

**Simple (par défaut) :**
```typescript
Progression = (Tâches terminées + 0.5 × Tâches en cours) / Total tâches × 100
```

**Pondérée (basée sur l'importance) :**
```typescript
Poids des priorités :
- Haute : 3 points
- Moyenne : 2 points  
- Basse : 1 point

Progression = Σ(Poids × État) / Σ(Poids) × 100
```

### 3. Détection des Tâches Critiques

**Une tâche est considérée critique si :**
- Priorité haute et non terminée
- En retard par rapport à la date de fin
- Bloquée (en cours depuis longtemps sans progression)

### 4. Évaluation des Risques

**Niveaux de risque :**
- **Faible** : Aucun problème détecté
- **Modéré** : 1-2 problèmes ou tâches critiques
- **Élevé** : 3+ problèmes ou tâches critiques

**Facteurs d'évaluation :**
- Nombre de tâches critiques
- Progression vs délai calendaire
- Utilisation du budget vs progression

## Architecture Technique

### Fichiers principaux

#### `lib/project-logic.ts`
Contient toute la logique métier pour la synchronisation :

**Fonctions principales :**
- `syncProjectWithTasks()` : Synchronisation complète
- `calculateWeightedProjectProgress()` : Progression pondérée
- `getCriticalTasks()` : Détection des tâches critiques
- `getProjectRisks()` : Évaluation des risques
- `generateProjectNotifications()` : Génération d'alertes

#### `components/projects/project-details.tsx`
Intègre la synchronisation automatique lors de :
- Création/modification/suppression de tâches
- Chargement des données du projet
- Mise à jour des statuts

#### `components/projects/project-risks-card.tsx`
Affiche en temps réel :
- Niveau de risque du projet
- Tâches critiques identifiées
- Recommandations d'actions

### Flux de Synchronisation

```
Événement (création/modif tâche)
    ↓
syncProjectProgress() appelé
    ↓
syncProjectWithTasks() calculé
    ↓
Vérification des changements
    ↓
Mise à jour automatique du projet
    ↓
Génération des notifications
    ↓
Affichage des risques en temps réel
```

## Configuration

### Règles de Statut

Les règles sont définies dans `PROJECT_STATUS_RULES` :

```typescript
{
  planning: { min: 0%, max: 10% },
  "in-progress": { min: 10%, max: 90% },
  "on-hold": { min: 0%, max: 90% },
  completed: { min: 100%, max: 100% }
}
```

### Seuils de Risque

- **Tâches critiques** : > 30% du total → Risque élevé
- **Retard calendaire** : Progression < (Écoulé - 20%) → Risque
- **Budget** : Utilisation > 80% avec progression < 80% → Risque

## Notifications

### Types d'alertes générées

1. **Changement de statut** : Info pour manager et équipe
2. **Progression significative** : Info pour stakeholders
3. **Risques élevés** : Erreur pour manager et direction
4. **Tâches critiques** : Avertissement pour manager et équipe

### Intégration des notifications

Actuellement loggées dans la console. Peut être intégré avec :
- Système de notifications push
- Emails automatiques
- Webhooks vers Slack/Teams

## Tests et Validation

### Validation de cohérence

Le système vérifie automatiquement :
- Cohérence statut/progression
- Dates des tâches vs projet
- Budget vs dépenses
- Progression réelle vs déclarée

### Gestion des erreurs

- Retry automatique en cas d'échec API
- Formats alternatifs de données
- Logs détaillés pour le débogage

## Personnalisation

### Adaptation des poids

Modifier `priorityWeights` dans `calculateWeightedProjectProgress()` :

```typescript
const priorityWeights = {
  high: 3,    // Tâches critiques
  medium: 2,  // Tâches importantes  
  low: 1      // Tâches secondaires
}
```

### Ajustement des seuils

Modifier les constantes dans les fonctions :
- `criticalPercentage` (30% par défaut)
- `elapsedPercentage` (20% de retard acceptable)
- `budgetUsage` (80% d'alerte)

## Bonnes Pratiques

### Pour les utilisateurs

1. **Prioriser correctement** les tâches pour une progression pondérée précise
2. **Maintenir à jour** les dates de fin des tâches
3. **Marquer comme terminées** les tâches réellement achevées
4. **Surveiller les alertes** de risques en temps réel

### Pour les développeurs

1. **Tester la synchronisation** après chaque modification
2. **Vérifier les logs** en cas de comportement inattendu
3. **Adapter les seuils** selon la spécificité des projets
4. **Intégrer les notifications** selon les besoins métier

## Dépannage

### Problèmes courants

**Progression non mise à jour :**
- Vérifier que les tâches ont des statuts valides
- Contrôler les logs de synchronisation

**Statut incorrect :**
- Vérifier les règles de transition dans `PROJECT_STATUS_RULES`
- Contrôler la cohérence progression/statut

**Notifications manquantes :**
- Vérifier que `generateProjectNotifications()` est appelé
- Contrôler les conditions de déclenchement

### Logs de débogage

Le système génère des logs détaillés :
- `=== SYNC PROJECT PROGRESS ===` : Début synchronisation
- `PROGRESS CHANGED` : Détection de changement
- `📢 NOTIFICATION` : Génération d'alertes
- `✅ Project updated successfully` : Mise à jour réussie
