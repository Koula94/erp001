"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react"
import { InvoiceFormDialog } from "@/components/finance/invoice-form-dialog"
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog"
import { BudgetFormDialog } from "@/components/finance/budget-form-dialog"

const statusColors = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const initialInvoices = [
  {
    id: "INV-001",
    clientName: "ABC Construction",
    projectName: "Villa Moderne A",
    amount: 125000,
    status: "paid",
    dueDate: "2024-01-15",
    items: [
      { description: "Foundation work", quantity: 1, unitPrice: 50000 },
      { description: "Structural framework", quantity: 1, unitPrice: 75000 },
    ],
  },
  {
    id: "INV-002",
    clientName: "XYZ Developers",
    projectName: "Commercial Plaza",
    amount: 250000,
    status: "sent",
    dueDate: "2024-02-01",
    items: [{ description: "Phase 1 completion", quantity: 1, unitPrice: 250000 }],
  },
]

const initialExpenses = [
  {
    id: "EXP-001",
    description: "Cement and concrete materials",
    category: "Materials",
    amount: 15000,
    date: "2024-01-10",
    project: "Villa Moderne A",
    vendor: "BuildMart Supplies",
    status: "approved",
  },
  {
    id: "EXP-002",
    description: "Equipment rental - Excavator",
    category: "Equipment",
    amount: 3500,
    date: "2024-01-12",
    project: "Commercial Plaza",
    vendor: "Heavy Equipment Co",
    status: "approved",
  },
]

const initialBudgets = [
  {
    id: "BUD-001",
    name: "Q1 2024 Operations",
    category: "Operations",
    allocated: 500000,
    spent: 325000,
    period: "Quarterly",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
  },
  {
    id: "BUD-002",
    name: "Villa Moderne A Budget",
    category: "Projects",
    allocated: 800000,
    spent: 450000,
    period: "Project",
    startDate: "2024-01-01",
    endDate: "2024-06-30",
  },
]

export default function FinancePage() {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [budgets, setBudgets] = useState(initialBudgets)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const totalRevenue = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0)
  const totalExpenses = expenses.filter((exp) => exp.status === "approved").reduce((sum, exp) => sum + exp.amount, 0)
  const pendingInvoices = invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").length

  const handleAddInvoice = (data: any) => {
    const newInvoice = {
      ...data,
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      amount: data.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0),
    }
    setInvoices([...invoices, newInvoice])
  }

  const handleAddExpense = (data: any) => {
    const newExpense = {
      ...data,
      id: `EXP-${String(expenses.length + 1).padStart(3, "0")}`,
    }
    setExpenses([...expenses, newExpense])
  }

  const handleAddBudget = (data: any) => {
    const newBudget = {
      ...data,
      id: `BUD-${String(budgets.length + 1).padStart(3, "0")}`,
    }
    setBudgets([...budgets, newBudget])
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance & Accounting</h1>
        <p className="text-muted-foreground">Manage invoices, expenses, budgets and financial reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue - totalExpenses).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage client invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.projectName}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Expense
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track and manage business expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>${expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.project}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[expense.status]}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setBudgetDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </div>

          <div className="grid gap-4">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.allocated) * 100
              const remaining = budget.allocated - budget.spent
              return (
                <Card key={budget.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{budget.name}</CardTitle>
                        <CardDescription>
                          {budget.category} • {budget.period}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{budget.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Budget Usage</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Allocated</p>
                        <p className="font-medium text-lg">${budget.allocated.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-medium text-lg">${budget.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium text-lg">${remaining.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        {new Date(budget.startDate).toLocaleDateString()} -{" "}
                        {new Date(budget.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and view financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Profit & Loss Statement</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Cash Flow Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Revenue Analysis</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Expense Breakdown</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InvoiceFormDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen} onSubmit={handleAddInvoice} />
      <ExpenseFormDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} onSubmit={handleAddExpense} />
      <BudgetFormDialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen} onSubmit={handleAddBudget} />
    </div>
  )
}
