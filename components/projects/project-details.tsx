"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Calendar, DollarSign, Users, CheckCircle2, Circle, Clock, Plus, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskFormDialog } from "./task-form-dialog"
import { MilestoneFormDialog } from "./milestone-form-dialog"
import { GanttChart } from "./gantt-chart"
import { ProjectRisksCard } from "./project-risks-card"
import { generateProjectNotifications } from "@/lib/project-logic"
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog"
import { OperationFormDialog } from "@/components/finance/operation-form-dialog"

const statusColors = {
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  planning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "on-hold": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const priorityColors = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-green-500/10 text-green-700 dark:text-green-400",
}

const milestoneIcons = {
  completed: CheckCircle2,
  "in-progress": Clock,
  pending: Circle,
}

interface ProjectDetailsProps {
  projectId: string
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

interface Milestone {
  id: string
  project: string
  title: string
  date: string
  status: "pending" | "in-progress" | "completed"
  description: string
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  project: { id: string; name: string }
  status: string
  priority: string
  submitted_by?: { id: string; name: string }
  approved_by?: { id: string; name: string }
  paid_by?: { id: string; name: string }
  payment_date?: string
  notes?: string
  receipt?: string
  created_at: string
  updated_at: string
}

interface OperationRequest {
  id: string
  reference: string
  project: { id: string; name: string }
  task_name: string
  requester: { id: string; name: string }
  request_date: string
  period: string
  total_amount: number
  description: string
  status: string
  validated_by?: { id: string; name: string }
  validation_date?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [operations, setOperations] = useState<OperationRequest[]>([])
  const [operationDialogOpen, setOperationDialogOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<OperationRequest | null>(null)

  useEffect(() => {
    loadProjectData()
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      
      const [projectData, tasksResponse, milestonesResponse, operationsResponse] = await Promise.all([
        api.projects.get(projectId) as Promise<Project>,
        api.tasks.list(`?project=${projectId}`),
        api.milestones.list(`?project=${projectId}`),
        api.get(`/finance/operation-requests/?project=${projectId}`)
      ])
      
      // Handle different response formats safely
      const tasksData = (Array.isArray(tasksResponse) ? tasksResponse : 
                       (tasksResponse && typeof tasksResponse === 'object' && 'results' in tasksResponse ? 
                        (tasksResponse as any).results : [])) as Task[]
      
      const milestonesData = (Array.isArray(milestonesResponse) ? milestonesResponse : 
                            (milestonesResponse && typeof milestonesResponse === 'object' && 'results' in milestonesResponse ? 
                             (milestonesResponse as any).results : [])) as Milestone[]
      
      const operationsData = (Array.isArray(operationsResponse) ? operationsResponse : 
                            (operationsResponse && typeof operationsResponse === 'object' && 'results' in operationsResponse ? 
                             (operationsResponse as any).results : [])) as OperationRequest[]
      
      console.log("Operations data loaded:", operationsData)
      
      // Filter tasks and milestones by project ID to ensure only this project's data is shown
      const filteredTasks = tasksData.filter(task => task.project === projectId)
      const filteredMilestones = milestonesData.filter(milestone => milestone.project === projectId)
      
      // Operations are already filtered by the API with ?project=${projectId}
      const filteredOperations = operationsData
      
      console.log("Filtered operations for project:", filteredOperations)
      
      setProject(projectData)
      setTasks(filteredTasks)
      setMilestones(filteredMilestones)
      setOperations(filteredOperations)
    } catch (error) {
      console.error("Failed to load project data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading project...</div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  const budgetUsed = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

  const handleAddTask = () => {
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await api.tasks.delete(taskId)
        const updatedTasks = tasks.filter((t) => t.id !== taskId)
        setTasks(updatedTasks)
        
        // Recharger le projet pour obtenir la progression mise à jour automatiquement par le backend
        const updatedProject = await api.projects.get(projectId) as Project
        setProject(updatedProject)
      } catch (error) {
        console.error("Failed to delete task:", error)
        alert("Failed to delete task")
      }
    }
  }

  const handleSubmitTask = async (taskData: any) => {
    try {
      if (editingTask) {
        const updatedTask = await api.tasks.update(editingTask.id, taskData) as Task
        const updatedTasks = tasks.map((t) => (t.id === editingTask.id ? updatedTask : t))
        setTasks(updatedTasks)
      } else {
        const newTask = await api.tasks.create({ ...taskData, project: projectId }) as Task
        const updatedTasks = [...tasks, newTask]
        setTasks(updatedTasks)
      }
      
      // Recharger le projet pour obtenir la progression mise à jour automatiquement par le backend
      const updatedProject = await api.projects.get(projectId) as Project
      setProject(updatedProject)
      
      setTaskDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save task:", error)
      const errorMessage = error.message || "Failed to save task"
      alert(`Failed to save task: ${errorMessage}`)
    }
  }

  const handleAddMilestone = () => {
    setEditingMilestone(null)
    setMilestoneDialogOpen(true)
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneDialogOpen(true)
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      try {
        await api.milestones.delete(milestoneId)
        setMilestones(milestones.filter((m) => m.id !== milestoneId))
      } catch (error) {
        console.error("Failed to delete milestone:", error)
        alert("Failed to delete milestone")
      }
    }
  }

  const handleSubmitMilestone = async (milestoneData: any) => {
    try {
      if (editingMilestone) {
        const updatedMilestone = await api.milestones.update(editingMilestone.id, milestoneData) as Milestone
        setMilestones(milestones.map((m) => (m.id === editingMilestone.id ? updatedMilestone : m)))
      } else {
        const newMilestone = await api.milestones.create({ ...milestoneData, project: projectId }) as Milestone
        setMilestones([...milestones, newMilestone])
      }
      setMilestoneDialogOpen(false)
    } catch (error) {
      console.error("Failed to save milestone:", error)
      alert("Failed to save milestone")
    }
  }

  const handleSaveExpense = async (expenseData: any) => {
    try {
      console.log("Creating expense with data:", expenseData)
      
      // Create new expense with workflow
      const response = await api.post('/finance/expenses/workflow/create/', {
        project: projectId,
        category: expenseData.category.toLowerCase(),
        amount: parseFloat(expenseData.amount),
        description: expenseData.description,
        date: expenseData.date,
        status: expenseData.status || 'draft',
        priority: expenseData.priority || 'medium',
        notes: expenseData.notes || '',
      }) as any
      
      console.log("API Response:", response)
      
      if (response.success) {
        const newExpense = response.expense
        setExpenses([...expenses, newExpense])
        
        // Show warnings if any
        if (response.warnings && response.warnings.length > 0) {
          alert(`⚠️ Alertes: ${response.warnings.join(', ')}`)
        }
        
        // Reload project to get updated budget
        const updatedProject = await api.projects.get(projectId) as Project
        setProject(updatedProject)
        
        alert("✅ Dépense créée avec succès!")
      } else {
        throw new Error(response.error || "Erreur inconnue lors de la création")
      }
      
      setExpenseDialogOpen(false)
    } catch (err: any) {
      console.error("Error saving expense:", err)
      const errorMessage = err.message || "Erreur lors de la sauvegarde"
      alert(`❌ Échec de la création: ${errorMessage}`)
    }
  }

  const handleAddOperation = () => {
    setEditingOperation(null)
    setOperationDialogOpen(true)
  }

  const handleEditOperation = (operation: OperationRequest) => {
    setEditingOperation(operation)
    setOperationDialogOpen(true)
  }

  const handleDeleteOperation = async (operationId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette demande d'opération ?")) {
      try {
        await api.operations.delete(operationId)
        setOperations(operations.filter((o) => o.id !== operationId))
      } catch (error) {
        console.error("Failed to delete operation:", error)
        alert("Échec de la suppression de l'opération")
      }
    }
  }

  const handleSubmitOperation = async (operationData: any) => {
    try {
      if (editingOperation) {
        const updatedOperation = await api.operations.update(editingOperation.id, operationData) as OperationRequest
        setOperations(operations.map((o) => (o.id === editingOperation.id ? updatedOperation : o)))
      } else {
        const newOperation = await api.operations.create({ ...operationData, project: projectId }) as OperationRequest
        setOperations([...operations, newOperation])
      }
      
      // Reload project to get updated budget
      const updatedProject = await api.projects.get(projectId) as Project
      setProject(updatedProject)
      
      setOperationDialogOpen(false)
    } catch (error: any) {
      console.error("Failed to save operation:", error)
      const errorMessage = error.message || "Échec de la sauvegarde"
      alert(`Échec de la sauvegarde: ${errorMessage}`)
    }
  }

  const handleWorkflowAction = async (operationId: string, action: string, data?: any) => {
    try {
      let response: any
      
      switch (action) {
        case 'submit':
          response = await api.operations.submit(operationId)
          break
        case 'validate':
          response = await api.operations.validate(operationId, data)
          break
        case 'reject':
          response = await api.operations.reject(operationId, data)
          break
        default:
          throw new Error(`Action non supportée: ${action}`)
      }
      
      if (response.id) {
        // Update local state
        setOperations(operations.map((o) => (o.id === operationId ? response : o)))
        
        // Reload project to get updated budget
        const updatedProject = await api.projects.get(projectId) as Project
        setProject(updatedProject)
        
        // Show success message
        alert(`✅ Action "${action}" effectuée avec succès`)
      } else {
        throw new Error(response.error || "Action failed")
      }
    } catch (err: any) {
      console.error("Error processing workflow action:", err)
      const errorMessage = err.message || "Échec de l'action"
      alert(`❌ Échec de l'action: ${errorMessage}`)
    }
  }

  const operationStatusColors: { [key: string]: string } = {
    draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    validated: "bg-green-500/10 text-green-700 dark:text-green-400",
    rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  }

  const periodLabels: { [key: string]: string } = {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    quarterly: "Trimestriel",
    yearly: "Annuel",
    one_time: "Ponctuel",
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription className="mt-2">{project.description}</CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Timeline</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                <p className="text-muted-foreground">to {new Date(project.end_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Budget</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">GNF{project.budget.toLocaleString()}</p>
                <p className="text-muted-foreground">GNF{project.spent.toLocaleString()} dépensé</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Team</span>
              </div>
              <div className="text-sm">
                <p className="font-medium">{project.manager_name}</p>
                <p className="text-muted-foreground">{project.team_members.length} team members</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Progress</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-2xl">{project.progress}%</p>
                <Progress value={project.progress} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte d'évaluation des risques */}
      {project && tasks.length > 0 && (
        <ProjectRisksCard project={project} tasks={tasks} />
      )}

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>Track and manage all project tasks</CardDescription>
                </div>
                <Button onClick={handleAddTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.assignee}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[task.status]}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="h-2 w-20" />
                          <span className="text-sm text-muted-foreground">{task.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(task.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <GanttChart tasks={tasks} projectStartDate={project.start_date} projectEndDate={project.end_date} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Milestones</CardTitle>
                  <CardDescription>Key milestones and deliverables</CardDescription>
                </div>
                <Button onClick={handleAddMilestone}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone, index) => {
                  const Icon = milestoneIcons[milestone.status as keyof typeof milestoneIcons]
                  return (
                    <div key={milestone.id} className="flex items-start gap-4">
                      <div className="relative">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            milestone.status === "completed" && "bg-green-500/10",
                            milestone.status === "in-progress" && "bg-blue-500/10",
                            milestone.status === "pending" && "bg-gray-500/10",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              milestone.status === "completed" && "text-green-600",
                              milestone.status === "in-progress" && "text-blue-600",
                              milestone.status === "pending" && "text-gray-600",
                            )}
                          />
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="absolute left-5 top-10 h-12 w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusColors[milestone.status]}>
                              {milestone.status}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => handleEditMilestone(milestone)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMilestone(milestone.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(milestone.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Opérations du Projet</CardTitle>
                  <CardDescription>Gérez les demandes d'opération financière pour ce projet</CardDescription>
                </div>
                <Button onClick={handleAddOperation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Opération
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune opération enregistrée pour ce projet</p>
                  <p className="text-sm">Créez votre première demande d'opération pour commencer</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Tâche</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Date demande</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="font-mono text-sm">
                          {operation.reference}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {operation.task_name}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(operation.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700">
                            {periodLabels[operation.period] || operation.period}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(operation.request_date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={operationStatusColors[operation.status]}>
                            {operation.status === 'draft' && 'Brouillon'}
                            {operation.status === 'submitted' && 'Soumis'}
                            {operation.status === 'validated' && 'Validé'}
                            {operation.status === 'rejected' && 'Rejeté'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditOperation(operation)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {operation.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleWorkflowAction(operation.id, 'submit')}
                              >
                                Soumettre
                              </Button>
                            )}
                            {operation.status === 'submitted' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs bg-green-500/10 text-green-700 hover:bg-green-500/20"
                                  onClick={() => handleWorkflowAction(operation.id, 'validate')}
                                >
                                  Valider
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs bg-red-500/10 text-red-700 hover:bg-red-500/20"
                                  onClick={() => {
                                    const reason = prompt("Raison du rejet:")
                                    if (reason) {
                                      handleWorkflowAction(operation.id, 'reject', { rejection_reason: reason })
                                    }
                                  }}
                                >
                                  Rejeter
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>Team members working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {project.manager_name
                        ? project.manager_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                        : "PM"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{project.manager_name || "No Manager Assigned"}</p>
                    <p className="text-sm text-muted-foreground">Project Manager</p>
                  </div>
                  <Badge>Manager</Badge>
                </div>
                {project.team_members?.map((member, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.name
                          ? member.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name || "Unnamed Team Member"}</p>
                      <p className="text-sm text-muted-foreground">Team Member</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dépenses du Projet</CardTitle>
                  <CardDescription>Gérez les dépenses associées à ce projet</CardDescription>
                </div>
                <Button onClick={() => setExpenseDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Dépense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune dépense enregistrée pour ce projet</p>
                  <p className="text-sm">Créez votre première dépense pour commencer</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          GNF{expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityColors[expense.priority as keyof typeof priorityColors]}>
                            {expense.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[expense.status as keyof typeof statusColors]}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Financial tracking for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">GNF{project.budget.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">GNF{project.spent.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">GNF{(project.budget - project.spent).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Budget Utilization</span>
                  <span className="text-sm font-medium">{budgetUsed.toFixed(1)}%</span>
                </div>
                <Progress value={budgetUsed} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={handleSubmitTask}
        task={editingTask}
        projectId={projectId}
      />
      <MilestoneFormDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        onSubmit={handleSubmitMilestone}
        milestone={editingMilestone}
        projectId={projectId}
      />
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSubmit={handleSaveExpense}
      />
      <OperationFormDialog
        open={operationDialogOpen}
        onOpenChange={setOperationDialogOpen}
        onSubmit={handleSubmitOperation}
        initialData={editingOperation ? {
          project: editingOperation.project?.id,
          task_name: editingOperation.task_name,
          period: editingOperation.period,
          total_amount: editingOperation.total_amount,
          description: editingOperation.description,
          status: editingOperation.status,
        } : undefined}
        projectId={projectId}
        projectName={project?.name}
      />
    </div>
  )
}
