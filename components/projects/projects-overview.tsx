"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, Pencil, Trash2, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { ProjectFormDialog } from "./project-form-dialog"
import { useProjectErrorHandler } from "@/hooks/use-error-handler"
import { 
  getStatusColor, 
  getBudgetStatus, 
  getBudgetColor, 
  validateProject,
  formatProgress,
  PROJECT_STATUS_RULES
} from "@/lib/project-logic"

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

interface ProjectsOverviewProps {
  onSelectProject: (projectId: string) => void
}

export function ProjectsOverview({ onSelectProject }: ProjectsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const { isLoading, error, hasError, handleProjectError, withErrorHandling } = useProjectErrorHandler()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    await withErrorHandling(async () => {
      const response = await api.projects.list()
      
      // Handle different response formats safely
      let projectsData: Project[] = []
      
      if (Array.isArray(response)) {
        projectsData = response
      } else if (response && typeof response === 'object') {
        // If response is an object with a results property (common in Django REST Framework)
        if ('results' in response && Array.isArray(response.results)) {
          projectsData = response.results
        } else {
          // If it's a single object, wrap it in an array
          projectsData = [response as Project]
        }
      }
      
      setProjects(projectsData)
    }, { retryCount: 2, retryDelay: 1000 })
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddProject = () => {
    setEditingProject(null)
    setDialogOpen(true)
  }

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this project?")) {
      await withErrorHandling(async () => {
        await api.projects.delete(projectId)
        setProjects(projects.filter((p) => p.id !== projectId))
      }, { retryCount: 1 })
    }
  }

  const handleSubmitProject = async (projectData: any) => {
    const result = await withErrorHandling(async () => {
      let updatedProject: Project
      
      if (editingProject) {
        updatedProject = await api.projects.update(editingProject.id, projectData) as Project
        setProjects(projects.map((p) => (p.id === editingProject.id ? updatedProject : p)))
      } else {
        updatedProject = await api.projects.create(projectData) as Project
        setProjects([...projects, updatedProject])
      }
      
      setDialogOpen(false)
      return updatedProject
    }, { retryCount: 1 })

    if (!result) {
      // Error already handled by withErrorHandling
      return
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const budgetUsed = (project.spent / project.budget) * 100
          const budgetStatus = getBudgetStatus(project.spent, project.budget)
          const validation = validateProject(project)
          const statusRules = PROJECT_STATUS_RULES[project.status]
          
          return (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1">{project.client_name}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    {!validation.isValid && (
                      <Badge variant="destructive" className="text-xs">
                        Incohérence
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Indicateur de cohérence statut/progression */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{formatProgress(project.progress)}</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    {statusRules && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Plage autorisée: {statusRules.minProgress}% - {statusRules.maxProgress}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Indicateur de budget */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Budget</span>
                    <Badge variant="outline" className={getBudgetColor(budgetStatus)}>
                      {budgetStatus === "under-budget" ? "Sous-budget" : 
                       budgetStatus === "on-budget" ? "Dans le budget" : "Dépassement"}
                    </Badge>
                  </div>
                  <Progress value={budgetUsed} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>${project.spent.toLocaleString()}</span>
                    <span>${project.budget.toLocaleString()}</span>
                  </div>
                </div>

                {/* Informations du projet */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-medium">{project.manager_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Équipe</p>
                    <p className="font-medium">{project.team_members.length} membres</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => onSelectProject(project.id)}
                  >
                    Détails
                  </Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleEditProject(project, e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleDeleteProject(project.id, e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Alertes de cohérence */}
                {!validation.isValid && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-xs text-red-700">
                        <strong>Incohérences détectées:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitProject}
        project={editingProject}
      />
    </div>
  )
}
