"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { getProjectRisks, getCriticalTasks } from "@/lib/project-logic"

interface Project {
  id: string
  name: string
  client_name: string
  status: "in-progress" | "planning" | "on-hold" | "completed"
  progress: number
  start_date: string
  end_date: string
  budget: number
  spent: number
  manager_name: string
  team_members: Array<{ name: string }>
  description: string
}

interface Task {
  id: string
  project: string
  title: string
  status: "pending" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  assignee: string
  start_date: string
  end_date: string
  progress: number
  description: string
}

interface ProjectRisksCardProps {
  project: Project
  tasks: Task[]
}

export function ProjectRisksCard({ project, tasks }: ProjectRisksCardProps) {
  const risks = getProjectRisks(project, tasks)
  const criticalTasks = getCriticalTasks(tasks)

  const getRiskIcon = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "medium":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />
    }
  }

  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200"
      case "medium":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200"
      case "low":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200"
      default:
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200"
    }
  }

  const getTaskPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-3 w-3 text-red-600" />
      case "medium":
        return <AlertCircle className="h-3 w-3 text-orange-600" />
      case "low":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      default:
        return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  if (risks.level === "low" && criticalTasks.length === 0) {
    return (
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Statut du projet
          </CardTitle>
          <CardDescription>
            Aucun risque détecté - Le projet progresse normalement
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`border-l-4 ${risks.level === "high" ? "border-l-red-500" : risks.level === "medium" ? "border-l-orange-500" : "border-l-green-500"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getRiskIcon(risks.level)}
            Évaluation des risques
          </CardTitle>
          <Badge variant="outline" className={getRiskColor(risks.level)}>
            {risks.level === "high" ? "Risque élevé" : risks.level === "medium" ? "Risque modéré" : "Risque faible"}
          </Badge>
        </div>
        <CardDescription>
          Analyse automatique basée sur les tâches et la progression
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Problèmes identifiés */}
        {risks.issues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Problèmes détectés:</h4>
            <ul className="space-y-1">
              {risks.issues.map((issue, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tâches critiques */}
        {criticalTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Tâches critiques ({criticalTasks.length}):</h4>
            <div className="space-y-2">
              {criticalTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                  <div className="flex items-center gap-2">
                    {getTaskPriorityIcon(task.priority)}
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.end_date && new Date(task.end_date) < new Date() && (
                      <Badge variant="destructive" className="text-xs">
                        En retard
                      </Badge>
                    )}
                    {task.status === "in-progress" && task.progress === 0 && (
                      <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-700">
                        Bloquée
                      </Badge>
                    )}
                    {task.priority === "high" && (
                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700">
                        Priorité haute
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {criticalTasks.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  + {criticalTasks.length - 3} autre(s) tâche(s) critique(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommandations */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Recommandations:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            {risks.level === "high" && (
              <>
                <li>• Examiner immédiatement les tâches critiques</li>
                <li>• Réévaluer les délais du projet</li>
                <li>• Informer la direction des risques identifiés</li>
              </>
            )}
            {risks.level === "medium" && (
              <>
                <li>• Surveiller les tâches à risque</li>
                <li>• Planifier des actions correctives</li>
                <li>• Mettre à jour les parties prenantes</li>
              </>
            )}
            {risks.level === "low" && (
              <>
                <li>• Continuer le suivi régulier</li>
                <li>• Maintenir la communication avec l'équipe</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
