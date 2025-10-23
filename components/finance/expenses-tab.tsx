"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Edit, Trash2, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { ExpenseFormDialog } from "./expense-form-dialog"
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

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  project: { id: string; name: string }
  status: string
}

export function ExpensesTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await api.expenses.list() as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setExpenses(data as Expense[])
      setError(null)
    } catch (err) {
      setError("Failed to load expenses")
      console.error("Error loading expenses:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      (expense.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSaveExpense = async (expenseData: any) => {
    try {
      if (editingExpense) {
        // Update existing expense
        const updatedExpense = await api.expenses.update(editingExpense.id, {
          project: "1", // TODO: Get from form or context
          category: expenseData.category.toLowerCase(),
          amount: expenseData.amount,
          description: expenseData.description,
          date: expenseData.date,
          status: expenseData.status,
        }) as Expense
        setExpenses(expenses.map((e) => (e.id === editingExpense.id ? updatedExpense : e)))
      } else {
        // Create new expense
        const newExpense = await api.expenses.create({
          project: "1", // TODO: Get from form or context
          category: expenseData.category.toLowerCase(),
          amount: expenseData.amount,
          description: expenseData.description,
          date: expenseData.date,
          status: expenseData.status,
        }) as Expense
        setExpenses([...expenses, newExpense])
      }
      setEditingExpense(null)
    } catch (err) {
      setError("Failed to save expense")
      console.error("Error saving expense:", err)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // Expenses don't have delete functionality in the API
      // We'll just remove it from the local state
      setExpenses(expenses.filter((e) => e.id !== expenseId))
      setDeletingExpenseId(null)
    } catch (err) {
      setError("Failed to delete expense")
      console.error("Error deleting expense:", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditingExpense(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Expense
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Track and manage business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? "No expenses found matching your search" : "No expenses found"}</p>
              <p className="text-sm">Record your first expense to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>${expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.project?.name || "No project"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[expense.status]}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveExpense}
        initialData={editingExpense ? {
          description: editingExpense.description,
          category: editingExpense.category,
          amount: editingExpense.amount,
          date: editingExpense.date,
          status: editingExpense.status,
        } : undefined}
      />

    </div>
  )
}
