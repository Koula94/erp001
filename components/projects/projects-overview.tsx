"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { ProjectFormDialog } from "./project-form-dialog"

const statusColors = {
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  planning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "on-hold": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
}

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

interface ProjectsOverviewProps {
  onSelectProject: (projectId: string) => void
}

export function ProjectsOverview({ onSelectProject }: ProjectsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
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
    } catch (error) {
      console.error("Failed to load projects:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
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
      try {
        await api.projects.delete(projectId)
        setProjects(projects.filter((p) => p.id !== projectId))
      } catch (error) {
        console.error("Failed to delete project:", error)
        alert("Failed to delete project")
      }
    }
  }

  const handleSubmitProject = async (projectData: any) => {
    try {
      if (editingProject) {
        const updatedProject = await api.projects.update(editingProject.id, projectData)
        setProjects(projects.map((p) => (p.id === editingProject.id ? updatedProject as Project : p)))
      } else {
        const newProject = await api.projects.create(projectData)
        setProjects([...projects, newProject as Project])
      }
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to save project:", error)
      alert("Failed to save project")
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
          return (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1">{project.client_name}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={statusColors[project.status]}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">{budgetUsed.toFixed(0)}% used</span>
                  </div>
                  <Progress value={budgetUsed} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>${project.spent.toLocaleString()}</span>
                    <span>${project.budget.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-medium">{project.manager_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Team</p>
                    <p className="font-medium">{project.team_members.length} members</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => onSelectProject(project.id)}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleEditProject(project, e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={(e) => handleDeleteProject(project.id, e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
