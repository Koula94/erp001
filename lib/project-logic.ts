// Logique métier pour la gestion cohérente des statuts et progression des projets

export interface ProjectStatusRules {
  status: "planning" | "in-progress" | "on-hold" | "completed"
  minProgress: number
  maxProgress: number
  allowedTransitions: string[]
  description: string
}

export const PROJECT_STATUS_RULES: Record<string, ProjectStatusRules> = {
  planning: {
    status: "planning",
    minProgress: 0,
    maxProgress: 10,
    allowedTransitions: ["in-progress", "on-hold"],
    description: "Projet en phase de planification"
  },
  "in-progress": {
    status: "in-progress",
    minProgress: 10,
    maxProgress: 90,
    allowedTransitions: ["completed", "on-hold"],
    description: "Projet en cours d'exécution"
  },
  "on-hold": {
    status: "on-hold",
    minProgress: 0,
    maxProgress: 90,
    allowedTransitions: ["in-progress", "planning"],
    description: "Projet mis en pause"
  },
  completed: {
    status: "completed",
    minProgress: 100,
    maxProgress: 100,
    allowedTransitions: [],
    description: "Projet terminé"
  }
}

// Validation de la cohérence statut/progression
export function validateProjectStatus(status: string, progress: number): { isValid: boolean; message?: string } {
  const rules = PROJECT_STATUS_RULES[status]
  
  if (!rules) {
    return { isValid: false, message: `Statut invalide: ${status}` }
  }

  if (progress < rules.minProgress) {
    return { 
      isValid: false, 
      message: `Progression trop faible (${progress}%) pour le statut "${status}". Minimum requis: ${rules.minProgress}%` 
    }
  }

  if (progress > rules.maxProgress) {
    return { 
      isValid: false, 
      message: `Progression trop élevée (${progress}%) pour le statut "${status}". Maximum autorisé: ${rules.maxProgress}%` 
    }
  }

  return { isValid: true }
}

// Validation de la transition de statut
export function validateStatusTransition(currentStatus: string, newStatus: string): { isValid: boolean; message?: string } {
  const currentRules = PROJECT_STATUS_RULES[currentStatus]
  
  if (!currentRules) {
    return { isValid: false, message: `Statut actuel invalide: ${currentStatus}` }
  }

  if (!currentRules.allowedTransitions.includes(newStatus)) {
    return { 
      isValid: false, 
      message: `Transition impossible de "${currentStatus}" vers "${newStatus}". Transitions autorisées: ${currentRules.allowedTransitions.join(", ")}` 
    }
  }

  return { isValid: true }
}

// Calcul automatique de la progression basée sur les tâches (simple)
export function calculateProjectProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) {
    return 0
  }

  const totalWeight = tasks.length
  const completedWeight = tasks.reduce((sum, task) => {
    if (task.status === "completed") return sum + 1
    if (task.status === "in-progress") return sum + 0.5
    return sum
  }, 0)

  return Math.round((completedWeight / totalWeight) * 100)
}

// Calcul de progression pondérée basée sur l'importance des tâches
export function calculateWeightedProjectProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) {
    return 0
  }

  const priorityWeights = {
    high: 3,
    medium: 2,
    low: 1
  }

  let totalWeight = 0
  let completedWeight = 0

  tasks.forEach(task => {
    const weight = priorityWeights[task.priority as keyof typeof priorityWeights] || 1
    
    if (task.status === "completed") {
      completedWeight += weight
    } else if (task.status === "in-progress") {
      completedWeight += weight * 0.5
    }
    
    totalWeight += weight
  })

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
}

// Détection des tâches clés/bloquées
export function getCriticalTasks(tasks: any[]): any[] {
  if (!tasks || tasks.length === 0) {
    return []
  }

  const today = new Date()
  const criticalTasks = tasks.filter(task => {
    // Tâches prioritaires hautes non terminées
    const isHighPriority = task.priority === "high" && task.status !== "completed"
    
    // Tâches en retard
    const isOverdue = task.end_date && new Date(task.end_date) < today && task.status !== "completed"
    
    // Tâches bloquées (en cours depuis longtemps sans progression)
    const isStalled = task.status === "in-progress" && task.progress === 0
    
    return isHighPriority || isOverdue || isStalled
  })

  return criticalTasks
}

// Détection des risques de blocage
export function getProjectRisks(project: any, tasks: any[]): { level: "low" | "medium" | "high"; issues: string[] } {
  const issues: string[] = []
  const criticalTasks = getCriticalTasks(tasks)
  
  // Risque basé sur les tâches critiques
  if (criticalTasks.length > 0) {
    issues.push(`${criticalTasks.length} tâche(s) critique(s) identifiée(s)`)
  }

  // Risque basé sur la progression vs délai
  if (project.start_date && project.end_date) {
    const startDate = new Date(project.start_date)
    const endDate = new Date(project.end_date)
    const today = new Date()
    
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsedDuration = today.getTime() - startDate.getTime()
    
    if (totalDuration > 0) {
      const elapsedPercentage = (elapsedDuration / totalDuration) * 100
      
      if (project.progress < elapsedPercentage - 20) {
        issues.push("Progression en retard par rapport au calendrier")
      }
    }
  }

  // Risque basé sur le budget
  if (project.budget && project.spent) {
    const budgetUsage = (project.spent / project.budget) * 100
    if (budgetUsage > 80 && project.progress < 80) {
      issues.push("Dépenses élevées par rapport à la progression")
    }
  }

  // Détermination du niveau de risque
  let level: "low" | "medium" | "high" = "low"
  
  if (issues.length >= 3 || criticalTasks.length >= 3) {
    level = "high"
  } else if (issues.length >= 1 || criticalTasks.length >= 1) {
    level = "medium"
  }

  return { level, issues }
}

// Mise à jour automatique du statut basé sur la progression
export function getAutoStatus(progress: number): string {
  if (progress === 100) return "completed"
  if (progress >= 10) return "in-progress"
  return "planning"
}

// Cohérence projet-tâche : validation des statuts
export function validateProjectTaskConsistency(project: any, tasks: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!project || !tasks) {
    return { isValid: true, errors }
  }

  // Calcul de la progression réelle basée sur les tâches
  const realProgress = calculateProjectProgress(tasks)
  
  // Vérification de la cohérence progression projet vs tâches
  if (Math.abs(project.progress - realProgress) > 5) {
    errors.push(`Progression incohérente: projet à ${project.progress}% mais tâches à ${realProgress}%`)
  }

  // Vérification des statuts cohérents
  if (project.status === "completed" && realProgress < 100) {
    errors.push("Projet marqué comme terminé mais progression des tâches inférieure à 100%")
  }

  if (project.status === "in-progress" && realProgress === 0) {
    errors.push("Projet en cours mais aucune tâche n'a commencé")
  }

  if (project.status === "planning" && realProgress > 10) {
    errors.push("Projet en planification mais progression des tâches supérieure à 10%")
  }

  // Vérification des tâches en retard
  const today = new Date()
  const overdueTasks = tasks.filter(task => {
    if (task.status !== "completed" && task.end_date) {
      const endDate = new Date(task.end_date)
      return endDate < today
    }
    return false
  })

  if (overdueTasks.length > 0 && project.status !== "on-hold") {
    errors.push(`${overdueTasks.length} tâche(s) en retard - le projet devrait être mis en attente`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Synchronisation automatique projet-tâches avec gestion avancée
export function syncProjectWithTasks(project: any, tasks: any[]): { project: any; changes: string[]; risks: { level: "low" | "medium" | "high"; issues: string[] } } {
  const changes: string[] = []
  
  if (!tasks || tasks.length === 0) {
    return { project, changes, risks: { level: "low", issues: [] } }
  }

  // Calcul de la progression (simple et pondérée)
  const realProgress = calculateProjectProgress(tasks)
  const weightedProgress = calculateWeightedProjectProgress(tasks)
  
  // Utiliser la progression pondérée si elle est significativement différente
  const finalProgress = Math.abs(realProgress - weightedProgress) > 10 ? weightedProgress : realProgress
  
  // Détection automatique du statut
  const autoStatus = getAutoStatus(finalProgress)
  
  // Détection des risques
  const risks = getProjectRisks(project, tasks)
  
  // Mise à jour automatique si nécessaire
  const updatedProject = { ...project }
  
  // Synchroniser la progression
  if (project.progress !== finalProgress) {
    updatedProject.progress = finalProgress
    changes.push(`Progression mise à jour de ${project.progress}% à ${finalProgress}%`)
  }

  // Synchroniser le statut si cohérent
  if (project.status !== autoStatus && validateStatusTransition(project.status, autoStatus).isValid) {
    updatedProject.status = autoStatus
    changes.push(`Statut mis à jour de "${project.status}" à "${autoStatus}"`)
  }

  // Gestion automatique des statuts basée sur les tâches critiques
  const criticalTasks = getCriticalTasks(tasks)
  if (criticalTasks.length > 0 && project.status !== "on-hold") {
    // Si plus de 30% des tâches sont critiques, mettre le projet en attente
    const criticalPercentage = (criticalTasks.length / tasks.length) * 100
    if (criticalPercentage > 30 && validateStatusTransition(project.status, "on-hold").isValid) {
      updatedProject.status = "on-hold"
      changes.push(`Projet mis en attente automatiquement (${criticalTasks.length} tâches critiques)`)
    }
  }

  // Réactivation automatique si les tâches critiques sont résolues
  if (project.status === "on-hold" && criticalTasks.length === 0 && validateStatusTransition("on-hold", "in-progress").isValid) {
    updatedProject.status = "in-progress"
    changes.push("Projet réactivé automatiquement (toutes les tâches critiques résolues)")
  }

  return { project: updatedProject, changes, risks }
}

// Fonction pour générer des notifications basées sur les changements
export function generateProjectNotifications(project: any, tasks: any[], changes: string[], risks: { level: "low" | "medium" | "high"; issues: string[] }): { type: "info" | "warning" | "error"; title: string; message: string; recipients: string[] }[] {
  const notifications = []
  
  // Notification de changement de statut
  if (changes.some(change => change.includes("Statut mis à jour"))) {
    notifications.push({
      type: "info" as const,
      title: "Changement de statut du projet",
      message: `Le projet "${project.name}" a changé de statut. ${changes.join(", ")}`,
      recipients: ["project_manager", "team_members"]
    })
  }

  // Notification de progression significative
  if (changes.some(change => change.includes("Progression mise à jour"))) {
    const progressChange = changes.find(change => change.includes("Progression mise à jour"))
    notifications.push({
      type: "info" as const,
      title: "Progression du projet mise à jour",
      message: `Progression du projet "${project.name}" : ${progressChange}`,
      recipients: ["project_manager", "stakeholders"]
    })
  }

  // Notification de risques élevés
  if (risks.level === "high") {
    notifications.push({
      type: "error" as const,
      title: "Risque élevé détecté",
      message: `Le projet "${project.name}" présente des risques élevés : ${risks.issues.join(", ")}`,
      recipients: ["project_manager", "management"]
    })
  }

  // Notification de tâches critiques
  const criticalTasks = getCriticalTasks(tasks)
  if (criticalTasks.length > 0) {
    notifications.push({
      type: "warning" as const,
      title: "Tâches critiques identifiées",
      message: `${criticalTasks.length} tâche(s) critique(s) identifiée(s) dans le projet "${project.name}"`,
      recipients: ["project_manager", "team_members"]
    })
  }

  return notifications
}

// Validation des tâches par rapport au projet
export function validateTaskAgainstProject(task: any, project: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!task || !project) {
    return { isValid: true, errors }
  }

  // Vérification des dates
  if (task.start_date && project.start_date) {
    const taskStart = new Date(task.start_date)
    const projectStart = new Date(project.start_date)
    
    if (taskStart < projectStart) {
      errors.push("La tâche ne peut pas commencer avant le projet")
    }
  }

  if (task.end_date && project.end_date) {
    const taskEnd = new Date(task.end_date)
    const projectEnd = new Date(project.end_date)
    
    if (taskEnd > projectEnd) {
      errors.push("La tâche ne peut pas se terminer après le projet")
    }
  }

  // Vérification du statut cohérent
  if (project.status === "completed" && task.status !== "completed") {
    errors.push("Le projet est terminé mais la tâche ne l'est pas")
  }

  if (project.status === "planning" && task.status === "completed") {
    errors.push("Le projet est en planification mais la tâche est terminée")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validation de la cohérence budget/dépenses
export function validateBudget(spent: number, budget: number): { isValid: boolean; message?: string } {
  if (spent < 0) {
    return { isValid: false, message: "Les dépenses ne peuvent pas être négatives" }
  }

  if (budget <= 0) {
    return { isValid: false, message: "Le budget doit être positif" }
  }

  if (spent > budget) {
    return { 
      isValid: false, 
      message: `Dépenses (${spent}) supérieures au budget (${budget})` 
    }
  }

  return { isValid: true }
}

// Correction automatique des incohérences budget
export function fixBudgetInconsistency(spent: number, budget: number): { fixedSpent: number; fixedBudget: number; changes: string[] } {
  const changes: string[] = []
  let fixedSpent = spent
  let fixedBudget = budget

  // Si dépenses > budget, ajuster le budget pour refléter la réalité
  if (spent > budget) {
    fixedBudget = Math.round(spent * 1.1) // Augmenter le budget de 10% pour avoir une marge
    changes.push(`Budget ajusté de ${budget} à ${fixedBudget} pour refléter les dépenses réelles`)
  }

  // Si budget est trop faible par rapport aux dépenses, ajuster
  if (budget > 0 && spent > budget * 0.9) {
    changes.push(`Budget utilisé à plus de 90% - risque de dépassement`)
  }

  return {
    fixedSpent,
    fixedBudget,
    changes
  }
}

// Calcul du statut de budget
export function getBudgetStatus(spent: number, budget: number): "under-budget" | "on-budget" | "over-budget" {
  const percentage = (spent / budget) * 100
  
  if (percentage < 80) return "under-budget"
  if (percentage <= 100) return "on-budget"
  return "over-budget"
}

// Validation complète d'un projet
export function validateProject(project: any): { isValid: boolean; errors: string[]; suggestions: string[] } {
  const errors: string[] = []
  const suggestions: string[] = []

  // Validation statut/progression
  const statusValidation = validateProjectStatus(project.status, project.progress)
  if (!statusValidation.isValid) {
    errors.push(statusValidation.message!)
  }

  // Validation budget avec suggestions de correction
  const budgetValidation = validateBudget(project.spent, project.budget)
  if (!budgetValidation.isValid) {
    errors.push(budgetValidation.message!)
    
    // Proposer une correction automatique
    const budgetFix = fixBudgetInconsistency(project.spent, project.budget)
    if (budgetFix.changes.length > 0) {
      suggestions.push(...budgetFix.changes)
    }
  }

  // Validation dates
  if (project.start_date && project.end_date) {
    const startDate = new Date(project.start_date)
    const endDate = new Date(project.end_date)
    
    if (endDate < startDate) {
      errors.push("La date de fin doit être après la date de début")
    }
  }

  // Vérification des risques budgétaires
  if (project.budget && project.spent) {
    const budgetUsage = (project.spent / project.budget) * 100
    if (budgetUsage > 90) {
      suggestions.push(`Budget utilisé à ${Math.round(budgetUsage)}% - risque de dépassement imminent`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  }
}

// Fonction utilitaire pour formater les pourcentages
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`
}

// Fonction utilitaire pour obtenir la couleur du statut
export function getStatusColor(status: string): string {
  const colors = {
    planning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "on-hold": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    completed: "bg-green-500/10 text-green-700 dark:text-green-400"
  }
  
  return colors[status as keyof typeof colors] || "bg-gray-500/10 text-gray-700 dark:text-gray-400"
}

// Fonction utilitaire pour obtenir la couleur du budget
export function getBudgetColor(status: "under-budget" | "on-budget" | "over-budget"): string {
  const colors = {
    "under-budget": "bg-green-500/10 text-green-700 dark:text-green-400",
    "on-budget": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "over-budget": "bg-red-500/10 text-red-700 dark:text-red-400"
  }
  
  return colors[status]
}
