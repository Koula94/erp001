"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Edit, Trash2, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { api } from "@/lib/api"
import { BudgetFormDialog } from "./budget-form-dialog"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Budget {
  id: string
  name: string
  category: string
  planned_amount: number
  spent_amount: number
  period_start: string
  period_end: string
}

export function BudgetsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const response = await api.budgets.list() as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setBudgets(data as Budget[])
      setError(null)
    } catch (err) {
      setError("Échec du chargement des budgets")
      console.error("Erreur lors du chargement des budgets :", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBudgets = budgets.filter(
    (budget) =>
      (budget.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (budget.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSaveBudget = async (budgetData: any) => {
    try {
      if (editingBudget) {
        // Update existing budget
        const updatedBudget = await api.budgets.update(editingBudget.id, {
          project: "1", // TODO: Get from form or context
          category: budgetData.name,
          planned_amount: budgetData.allocated,
          spent_amount: budgetData.spent || 0,
          period_start: budgetData.startDate,
          period_end: budgetData.endDate,
        }) as Budget
        setBudgets(budgets.map((b) => (b.id === editingBudget.id ? updatedBudget : b)))
      } else {
        // Create new budget
        const newBudget = await api.budgets.create({
          project: "1", // TODO: Get from form or context
          category: budgetData.name,
          planned_amount: budgetData.allocated,
          spent_amount: budgetData.spent || 0,
          period_start: budgetData.startDate,
          period_end: budgetData.endDate,
        }) as Budget
        setBudgets([...budgets, newBudget])
      }
      setEditingBudget(null)
    } catch (err) {
      setError("Échec de l'enregistrement du budget")
      console.error("Erreur lors de l'enregistrement du budget :", err)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      // Budgets don't have delete functionality in the API
      // We'll just remove it from the local state
      setBudgets(budgets.filter((b) => b.id !== budgetId))
      setDeletingBudgetId(null)
    } catch (err) {
      setError("Échec de la suppression du budget")
      console.error("Erreur lors de la suppression du budget :", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des budgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer un Budget
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Gérez les budgets des projets et départements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? "Aucun budget ne correspond à votre recherche" : "Aucun budget trouvé"}</p>
              <p className="text-sm">Créez votre premier budget pour commencer</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBudgets.map((budget) => {
                const percentage = (budget.spent_amount / budget.planned_amount) * 100
                const remaining = budget.planned_amount - budget.spent_amount
                const isOverBudget = budget.spent_amount > budget.planned_amount
                
                return (
                  <Card key={budget.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{budget.name}</CardTitle>
                          <CardDescription>
                            {budget.category} • {budget.period_start} to {budget.period_end}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverBudget ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <Badge variant="outline" className={isOverBudget ? "text-red-600" : "text-green-600"}>
                            {budget.id}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Utilisation du Budget</span>
                          <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Alloué</p>
                          <p className="font-medium text-lg">${budget.planned_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dépensé</p>
                          <p className="font-medium text-lg">${budget.spent_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Restant</p>
                          <p className={`font-medium text-lg ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
                            ${remaining.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>
                          {new Date(budget.period_start).toLocaleDateString()} -{" "}
                          {new Date(budget.period_end).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditBudget(budget)}>
                          <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveBudget}
        initialData={editingBudget ? {
          name: editingBudget.name,
          allocated: editingBudget.planned_amount,
          spent: editingBudget.spent_amount,
          startDate: editingBudget.period_start,
          endDate: editingBudget.period_end,
        } : undefined}
      />
    </div>
  )
}
