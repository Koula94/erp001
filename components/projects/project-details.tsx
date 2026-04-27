"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { Project, Task, Milestone, Expense, OperationRequest, OperationStats, ExpenseStats } from "@/lib/project-types"
import { ProjectHeader } from "./project-header"
import { ProjectRisksCard } from "./project-risks-card"
import { GanttChart } from "./gantt-chart"
import { ProjectTasksTab } from "./tabs/project-tasks-tab"
import { ProjectMilestonesTab } from "./tabs/project-milestones-tab"
import { ProjectOperationsTab } from "./tabs/project-operations-tab"
import { ProjectExpensesTab } from "./tabs/project-expenses-tab"
import { ProjectTeamTab } from "./tabs/project-team-tab"
import { ProjectBudgetTab } from "./tabs/project-budget-tab"
import { TaskFormDialog } from "./task-form-dialog"
import { MilestoneFormDialog } from "./milestone-form-dialog"
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog"
import { ExpenseDetailDialog } from "@/components/finance/expense-detail-dialog"
import { OperationFormDialog } from "@/components/finance/operation-form-dialog"
import { OperationDetailDialog, type Operation } from "@/components/finance/operation-detail-dialog"

interface ProjectDetailsProps {
  projectId: string
}

export function ProjectDetails({ projectId }: ProjectDetailsProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [operations, setOperations] = useState<OperationRequest[]>([])
  const [operationStats, setOperationStats] = useState<OperationStats>({
    total_demande: 0, total_valide: 0, total_paye: 0, reste_a_payer: 0,
    total_count: 0, valide_count: 0, paye_count: 0, en_attente_count: 0,
  })
  const [expenseStats, setExpenseStats] = useState<ExpenseStats>({
    total_depense: 0, total_budget_projet: 0, total_caisse_operations: 0,
    total_fonds_urgence: 0, total_global: 0, total_count: 0,
  })
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [operationDialogOpen, setOperationDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingOperation, setEditingOperation] = useState<OperationRequest | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<OperationRequest | null>(null)
  const [isOperationDetailOpen, setIsOperationDetailOpen] = useState(false)
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null)
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false)

  useEffect(() => {
    loadProjectData()
    const interval = setInterval(() => loadProjectData(true), 10000)
    return () => clearInterval(interval)
  }, [projectId])

  const normalizeExpenses = (raw: any[]): Expense[] => {
    return raw.map((exp: any) => {
      const proj = exp.project && typeof exp.project === "object" && !Array.isArray(exp.project)
        ? { id: String(exp.project.id), name: exp.project.name || exp.project_name || "Sans projet" }
        : exp.project
          ? { id: String(exp.project), name: exp.project_name || "Sans projet" }
          : { id: "", name: "Sans projet" }
      return { ...exp, project: proj } as Expense
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const safeResults = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response as T[]
    if (response && typeof response === "object" && "results" in response) return (response as any).results as T[]
    return []
  }

  const loadProjectData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("Utilisateur non authentifié")

      const [projectData, tasksRes, milestonesRes, operationsRes, expensesRes] = await Promise.allSettled([
        api.projects.get(projectId) as Promise<Project>,
        api.tasks.list(`?project=${projectId}`),
        api.milestones.list(`?project=${projectId}`),
        api.get(`/finance/operation-requests/?project=${projectId}`),
        api.get(`/finance/expenses/?project=${projectId}`),
      ])

      if (projectData.status === "fulfilled") setProject(projectData.value)
      else throw new Error("Échec du chargement du projet")

      setTasks(safeResults<Task>(tasksRes.status === "fulfilled" ? tasksRes.value : []).filter(t => t.project === projectId))
      setMilestones(safeResults<Milestone>(milestonesRes.status === "fulfilled" ? milestonesRes.value : []).filter(m => m.project === projectId))
      setOperations(safeResults<OperationRequest>(operationsRes.status === "fulfilled" ? operationsRes.value : []))
      setExpenses(normalizeExpenses(safeResults<any>(expensesRes.status === "fulfilled" ? expensesRes.value : [])))

      // Stats
      try {
        const opStats = await api.get(`/finance/operation-requests/project_summary/?project=${projectId}`) as any
        if (opStats?.total_demande !== undefined) setOperationStats(opStats)
      } catch (e) { console.error("Failed to load operation stats:", e) }

      try {
        const expStats = await api.get(`/finance/expenses/project_summary/?project=${projectId}`) as any
        if (expStats?.total_depense !== undefined) setExpenseStats(expStats)
      } catch (e) { console.error("Failed to load expense stats:", e) }
    } catch (error: any) {
      console.error("Failed to load project data:", error)
      if (error?.message?.includes("401") || error?.status === 401) {
        alert("Erreur d'authentification. Veuillez vous connecter.")
      } else if (error?.message) {
        alert(`Erreur: ${error.message}`)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Chargement du projet...</div>
  if (!project) return <div className="p-8">Projet non trouvé</div>

  // ─── Task handlers ───
  const handleAddTask = () => { setEditingTask(null); setTaskDialogOpen(true) }
  const handleEditTask = (task: Task) => { setEditingTask(task); setTaskDialogOpen(true) }
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return
    try { await api.tasks.delete(taskId); setTasks(tasks.filter(t => t.id !== taskId)); setProject(await api.projects.get(projectId) as Project) }
    catch { alert("Échec de la suppression") }
  }
  const handleSubmitTask = async (taskData: any) => {
    try {
      if (editingTask) { const u = await api.tasks.update(editingTask.id, taskData) as Task; setTasks(tasks.map(t => t.id === editingTask.id ? u : t)) }
      else { const n = await api.tasks.create({ ...taskData, project: projectId }) as Task; setTasks([...tasks, n]) }
      setProject(await api.projects.get(projectId) as Project); setTaskDialogOpen(false)
    } catch (e: any) { alert(`Échec: ${e.message}`) }
  }

  // ─── Milestone handlers ───
  const handleAddMilestone = () => { setEditingMilestone(null); setMilestoneDialogOpen(true) }
  const handleEditMilestone = (m: Milestone) => { setEditingMilestone(m); setMilestoneDialogOpen(true) }
  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Supprimer ce jalon ?")) return
    try { await api.milestones.delete(id); setMilestones(milestones.filter(m => m.id !== id)) }
    catch { alert("Échec de la suppression") }
  }
  const handleSubmitMilestone = async (data: any) => {
    try {
      if (editingMilestone) { const u = await api.milestones.update(editingMilestone.id, data) as Milestone; setMilestones(milestones.map(m => m.id === editingMilestone.id ? u : m)) }
      else { const n = await api.milestones.create({ ...data, project: projectId }) as Milestone; setMilestones([...milestones, n]) }
      setMilestoneDialogOpen(false)
    } catch { alert("Échec de la sauvegarde") }
  }

  // ─── Expense handlers ───
  const handleAddExpense = () => { setEditingExpense(null); setExpenseDialogOpen(true) }
  const handleEditExpense = (expense: Expense) => { setEditingExpense(expense); setExpenseDialogOpen(true) }
  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return
    try { await api.delete(`/finance/expenses/${id}/`); setExpenses(expenses.filter(e => e.id !== id)) }
    catch { alert("Échec de la suppression") }
  }
  const handleSaveExpense = async (data: any) => {
    try {
      const hasReceiptFile = data.receiptFile instanceof File
      const payload = { project: projectId, category: data.category.toLowerCase(), amount: parseFloat(data.amount), description: data.description, date: data.date, status: data.status || "draft", priority: data.priority || "medium", notes: data.notes || "", subcategory: data.subcategory || "", subcategories: data.subcategories || [], fund_source: data.fund_source || "project_budget" }

      if (hasReceiptFile) {
        // Upload avec fichier via FormData
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        })
        formData.append("receipt", data.receiptFile)

        const token = localStorage.getItem("access_token")
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

        if (editingExpense) {
          const response = await fetch(`${baseUrl}/finance/expenses/${editingExpense.id}/`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
          })
          if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
          const updated = await response.json()
          setExpenses(expenses.map(e => e.id === editingExpense.id ? updated : e))
          alert("✅ Dépense mise à jour avec succès!")
        } else {
          const response = await fetch(`${baseUrl}/finance/expenses/workflow/create/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
          }
          const responseData = await response.json()
          if (responseData.success) {
            const expRes = await api.get(`/finance/expenses/?project=${projectId}`) as any
            setExpenses(normalizeExpenses(safeResults<any>(expRes)))
            if (responseData.warnings?.length) alert(`⚠️ ${responseData.warnings.join(", ")}`)
            alert(`✅ ${responseData.message || "Dépense créée avec succès!"}`)
          } else {
            throw new Error(responseData.error || "Erreur inconnue")
          }
        }
      } else {
        // Pas de fichier — utiliser l'API normale en JSON
        if (editingExpense) {
          const res = (await api.put(`/finance/expenses/${editingExpense.id}/`, payload)) as Record<string, any>
          if (res.id) { setExpenses(expenses.map(e => e.id === editingExpense.id ? res as Expense : e)); alert("✅ Dépense mise à jour") }
        } else {
          const res = (await api.post("/finance/expenses/workflow/create/", payload)) as Record<string, any>
          if (res.success) {
            const expRes = await api.get(`/finance/expenses/?project=${projectId}`) as any
            setExpenses(normalizeExpenses(safeResults<any>(expRes)))
            if (res.warnings?.length) alert(`⚠️ ${res.warnings.join(", ")}`)
            alert("✅ Dépense créée")
          } else throw new Error(res.error)
        }
      }
      setProject(await api.projects.get(projectId) as Project)
      setExpenseDialogOpen(false); setEditingExpense(null)
    } catch (e: any) { alert(`❌ Échec: ${e.message}`) }
  }
  const handleExpenseWorkflow = async (id: string, action: string) => {
    try {
      const endpoint = action === "submit" ? `/finance/expenses/${id}/workflow/submit/` : action === "approve" ? `/finance/expenses/${id}/approve/` : `/finance/expenses/${id}/reject/`
      const res = await api.post<Record<string, any>>(endpoint, {})
      if (res.id || res.success) {
        const expRes = await api.get(`/finance/expenses/?project=${projectId}`) as any
        setExpenses(normalizeExpenses(safeResults<any>(expRes)))
        setProject(await api.projects.get(projectId) as Project)
        alert(`✅ Action "${action}" effectuée`)
      }
    } catch (e: any) { alert(`❌ Échec: ${e.message}`) }
  }

  // ─── Operation handlers ───
  const handleAddOperation = () => { setEditingOperation(null); setOperationDialogOpen(true) }
  const handleEditOperation = (op: OperationRequest) => { setEditingOperation(op); setOperationDialogOpen(true) }
  const handleDeleteOperation = async (id: string) => {
    if (!confirm("Supprimer cette opération ?")) return
    try { await api.operations.delete(id); setOperations(operations.filter(o => o.id !== id)) }
    catch { alert("Échec de la suppression") }
  }
  const handleSubmitOperation = async (data: any) => {
    try {
      if (!localStorage.getItem("access_token")) { alert("Non authentifié"); window.location.href = "/login"; return }
      if (editingOperation) { const u = await api.operations.update(editingOperation.id, data) as OperationRequest; setOperations(operations.map(o => o.id === editingOperation.id ? u : o)) }
      else { await api.operations.create({ ...data, project: projectId }) }
      const opRes = await api.get(`/finance/operation-requests/?project=${projectId}`) as any
      setOperations(safeResults<OperationRequest>(opRes))
      const opStats = await api.get(`/finance/operation-requests/project_summary/?project=${projectId}`) as any
      if (opStats?.total_demande !== undefined) setOperationStats(opStats)
      setProject(await api.projects.get(projectId) as Project)
      setOperationDialogOpen(false); alert("✅ Opération sauvegardée")
    } catch (e: any) { alert(`❌ Échec: ${e.message}`) }
  }
  const handleOperationWorkflow = async (id: string, action: string, data?: any) => {
    try {
      let res: any
      if (action === "submit") res = await api.operations.submit(id)
      else if (action === "validate") res = await api.operations.validate(id, data)
      else if (action === "pay") res = await api.post(`/finance/operation-requests/${id}/pay/`, data || {})
      else if (action === "reject") res = await api.operations.reject(id, data)
      if (res.id) {
        setOperations(operations.map(o => o.id === id ? res : o))
        const opStats = await api.get(`/finance/operation-requests/project_summary/?project=${projectId}`) as any
        if (opStats?.total_demande !== undefined) setOperationStats(opStats)
        setProject(await api.projects.get(projectId) as Project)
        alert(`✅ Action "${action}" effectuée`)
      }
    } catch (e: any) {
      let msg = e.message || "Échec"
      if (msg.includes("Validation budget échouée:")) msg = msg.replace("Validation budget échouée:", "VALIDATION BUDGET ÉCHOUÉE\n\n")
      alert(`❌ ${msg}`)
    }
  }

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />
      {tasks.length > 0 && <ProjectRisksCard project={project} tasks={tasks} />}

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
          <ProjectTasksTab tasks={tasks} onAdd={handleAddTask} onEdit={handleEditTask} onDelete={handleDeleteTask} />
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <GanttChart tasks={tasks} projectStartDate={project.start_date} projectEndDate={project.end_date} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <ProjectMilestonesTab milestones={milestones} onAdd={handleAddMilestone} onEdit={handleEditMilestone} onDelete={handleDeleteMilestone} />
        </TabsContent>

        <TabsContent value="operations" className="mt-6">
          <ProjectOperationsTab
            operations={operations}
            stats={operationStats}
            onAdd={handleAddOperation}
            onEdit={handleEditOperation}
            onDelete={handleDeleteOperation}
            onWorkflowAction={handleOperationWorkflow}
            onViewDetail={(op) => { setSelectedOperation(op); setIsOperationDetailOpen(true) }}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ProjectExpensesTab
            project={project}
            expenses={expenses}
            expenseStats={expenseStats}
            operationStats={operationStats}
            onAdd={handleAddExpense}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
            onViewDetail={(exp) => { setDetailExpenseId(exp.id); setIsExpenseDetailOpen(true) }}
          />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <ProjectTeamTab project={project} />
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <ProjectBudgetTab project={project} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TaskFormDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} onSubmit={handleSubmitTask} task={editingTask} projectId={projectId} />
      <MilestoneFormDialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen} onSubmit={handleSubmitMilestone} milestone={editingMilestone} projectId={projectId} />
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        onSubmit={handleSaveExpense}
        initialData={editingExpense ? { description: editingExpense.description, category: editingExpense.category, amount: editingExpense.amount, date: editingExpense.date, status: editingExpense.status, priority: editingExpense.priority, notes: editingExpense.notes, subcategory: editingExpense.subcategory, subcategories: editingExpense.subcategories } : undefined}
        projectId={projectId}
        projectName={project.name}
      />
      <OperationFormDialog
        open={operationDialogOpen}
        onOpenChange={setOperationDialogOpen}
        onSubmit={handleSubmitOperation}
        initialData={editingOperation ? { project: editingOperation.project?.id, task_name: editingOperation.task_name, period: editingOperation.period, total_amount: editingOperation.total_amount, description: editingOperation.description, status: editingOperation.status } : undefined}
        projectId={projectId}
        projectName={project.name}
      />
      <OperationDetailDialog open={isOperationDetailOpen} onOpenChange={setIsOperationDetailOpen} operation={selectedOperation} />
      <ExpenseDetailDialog open={isExpenseDetailOpen} onOpenChange={setIsExpenseDetailOpen} expenseId={detailExpenseId} />
    </div>
  )
}
