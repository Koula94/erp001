"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  pendingInvoices: number
}

interface Invoice {
  id: string
  invoice_number: string
  client: { id: string; name: string }
  project: { id: string; name: string }
  amount: string
  status: string
  due_date: string
}

interface Expense {
  id: string
  description: string
  category: string
  amount: string
  date: string
  project: { id: string; name: string }
  status: string
}

interface ApiResponse<T> {
  results?: T[]
  data?: T[]
}

export function FinanceOverview() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadFinanceStats()
    } else if (!authLoading && !user) {
      setLoading(false)
      setError("Authentication required. Please log in.")
    }
  }, [user, authLoading])

  const loadFinanceStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Loading finance stats...")
      
      // Charger les données depuis l'API
      const [invoicesData, expensesData] = await Promise.all([
        api.invoices.list(),
        api.expenses.list()
      ])

      console.log("Raw invoices data:", invoicesData)
      console.log("Raw expenses data:", expensesData)

      // Handle different response formats
      const invoicesDataTyped = invoicesData as ApiResponse<Invoice> | Invoice[]
      const expensesDataTyped = expensesData as ApiResponse<Expense> | Expense[]
      
      const invoices = Array.isArray(invoicesDataTyped) ? invoicesDataTyped : 
                      invoicesDataTyped?.results || invoicesDataTyped?.data || []
      const expenses = Array.isArray(expensesDataTyped) ? expensesDataTyped : 
                      expensesDataTyped?.results || expensesDataTyped?.data || []

      console.log("Processed invoices:", invoices)
      console.log("Processed expenses:", expenses)

      // Check if we have any paid invoices
      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === "paid")
      console.log("Paid invoices:", paidInvoices)

      // Check if we have any approved expenses
      const approvedExpenses = expenses.filter((exp: Expense) => exp.status === "approved")
      console.log("Approved expenses:", approvedExpenses)

      // Calculer les statistiques
      const totalRevenue = paidInvoices.reduce((sum: number, inv: Invoice) => {
        const amount = parseFloat(inv.amount) || 0
        console.log(`Invoice ${inv.invoice_number}: amount=${inv.amount}, parsed=${amount}`)
        return sum + amount
      }, 0)

      const totalExpenses = approvedExpenses.reduce((sum: number, exp: Expense) => {
        const amount = parseFloat(exp.amount) || 0
        console.log(`Expense ${exp.description}: amount=${exp.amount}, parsed=${amount}`)
        return sum + amount
      }, 0)

      const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === "sent" || inv.status === "overdue").length

      console.log("Calculated stats:", {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices
      })

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices
      })
    } catch (error: any) {
      console.error("Error loading finance stats:", error)
      setError(error.message || "Failed to load finance data")
      // Set default stats on error
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingInvoices: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Please log in to view finance data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} GNF</div>
          <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalExpenses.toLocaleString()} GNF</div>
          <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.netProfit.toLocaleString()} GNF</div>
          <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
          <FileText className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
          <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
        </CardContent>
      </Card>
    </div>
  )
}
