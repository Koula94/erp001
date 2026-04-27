"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Expense } from "@/lib/project-types"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseDetailDialog } from "./expense-detail-dialog"
import { ExpenseDataTable } from "./expense-data-table"

export function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailExpenseId, setDetailExpenseId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    loadExpenses()
    loadProjects()
    const interval = setInterval(() => loadExpenses(true), 10000)
    return () => clearInterval(interval)
  }, [])

  const loadProjects = async () => {
    try {
      const response = await api.projects.list() as any
      const list = Array.isArray(response) ? response : response.results || response.data || []
      setProjects(list.map((p: any) => ({ id: String(p.id), name: p.name })))
    } catch (err) {
      console.error("Erreur lors du chargement des projets :", err)
    }
  }

  const loadExpenses = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await api.expenses.list() as any
      const rawData = Array.isArray(response) ? response : response.results || response.data || []

      const data: Expense[] = rawData.map((exp: any) => ({
        id: exp.id,
        description: exp.description,
        category: exp.category,
        subcategory: exp.subcategory,
        subcategories: exp.subcategories,
        amount: parseFloat(exp.amount),
        date: exp.date,
        project: exp.project && typeof exp.project === "object" && !Array.isArray(exp.project)
          ? { id: String(exp.project.id), name: exp.project.name || exp.project_name || "Sans projet" }
          : exp.project
            ? { id: String(exp.project), name: exp.project_name || "Sans projet" }
            : { id: "", name: "Sans projet" },
        notes: exp.notes,
        receipt: exp.receipt,
        receipt_url: exp.receipt_url,
      }))

      setExpenses(data)
      setError(null)
    } catch (err) {
      setError("Erreur lors du chargement des dépenses")
      console.error("Erreur lors du chargement des dépenses :", err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleSaveExpense = async (expenseData: any) => {
    try {
      const hasReceiptFile = expenseData.receiptFile instanceof File

      // Si un fichier est présent, utiliser FormData
      if (hasReceiptFile) {
        const formData = new FormData()
        formData.append("project", String(expenseData.project || "1"))
        formData.append("category", expenseData.category.toLowerCase())
        formData.append("amount", String(expenseData.amount))
        formData.append("description", expenseData.description)
        formData.append("date", expenseData.date)
        formData.append("status", expenseData.status || "approved")
        formData.append("notes", expenseData.notes || "")
        formData.append("subcategory", expenseData.subcategory || "")
        formData.append("fund_source", expenseData.fund_source || "project_budget")

        // Ajouter les sous-catégories en JSON
        if (expenseData.subcategories && expenseData.subcategories.length > 0) {
          formData.append("subcategories", JSON.stringify(expenseData.subcategories))
        }

        // Ajouter le fichier
        formData.append("receipt", expenseData.receiptFile)

        if (editingExpense) {
          // Mise à jour avec fichier
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/finance/expenses/${editingExpense.id}/`, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
          })
          if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`)
          const updated = await response.json()
          setExpenses(expenses.map((e) => (e.id === editingExpense.id ? updated : e)))
          alert("✅ Dépense mise à jour avec succès!")
        } else {
          // Création avec fichier
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/finance/expenses/workflow/create/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: formData,
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
          }
          const responseData = await response.json()
          if (responseData.success) {
            setExpenses([...expenses, responseData.expense])
            if (responseData.warnings?.length) alert(`⚠️ Alertes: ${responseData.warnings.join(", ")}`)
            alert(`✅ ${responseData.message || "Dépense créée avec succès!"}`)
          } else {
            alert(`❌ Échec: ${responseData.error || "Erreur inconnue"}`)
            return
          }
        }
      } else {
        // Pas de fichier — utiliser l'API normale en JSON
        const payload = {
          project: expenseData.project || "1",
          category: expenseData.category.toLowerCase(),
          amount: expenseData.amount,
          description: expenseData.description,
          date: expenseData.date,
          status: expenseData.status,
          notes: expenseData.notes,
          subcategory: expenseData.subcategory || "",
          subcategories: expenseData.subcategories || [],
          fund_source: expenseData.fund_source || "project_budget",
        }

        if (editingExpense) {
          const updated = await api.expenses.update(editingExpense.id, payload) as Expense
          setExpenses(expenses.map((e) => (e.id === editingExpense.id ? updated : e)))
          alert("✅ Dépense mise à jour avec succès!")
        } else {
          const response = await api.post("/finance/expenses/workflow/create/", payload) as any
          if (response.success) {
            setExpenses([...expenses, response.expense])
            if (response.warnings?.length) alert(`⚠️ Alertes: ${response.warnings.join(", ")}`)
            alert(`✅ ${response.message || "Dépense créée avec succès!"}`)
          } else {
            alert(`❌ Échec: ${response.error || "Erreur inconnue"}`)
            return
          }
        }
      }

      setEditingExpense(null)
      setIsFormOpen(false)
    } catch (err: any) {
      const msg = err?.message || "Échec de la sauvegarde"
      setError(msg)
      alert(`❌ ${msg}`)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId))
  }

  const handleViewDetail = (expense: Expense) => {
    setDetailExpenseId(expense.id)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-4">
      <ExpenseDataTable
        mode="global"
        expenses={expenses}
        projects={projects}
        loading={loading}
        onAdd={() => { setEditingExpense(null); setIsFormOpen(true) }}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
        onViewDetail={handleViewDetail}
      />

      {error && <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">{error}</div>}

      <ExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveExpense}
        initialData={editingExpense ? {
          description: editingExpense.description,
          category: editingExpense.category,
          amount: editingExpense.amount,
          date: editingExpense.date,
          status: "approved",
          subcategory: editingExpense.subcategory,
          subcategories: editingExpense.subcategories,
        } : undefined}
      />
      <ExpenseDetailDialog open={isDetailOpen} onOpenChange={setIsDetailOpen} expenseId={detailExpenseId} />
    </div>
  )
}
