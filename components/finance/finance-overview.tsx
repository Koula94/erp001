"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  AlertCircle, 
  Receipt, 
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface FinanceStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  pendingInvoices: number
  totalInvoices: number
  paidInvoices: number
  overdueInvoices: number
  draftInvoices: number
  totalExpensesCount: number
  approvedExpenses: number
  pendingExpenses: number
  rejectedExpenses: number
  profitMargin: number
  expenseRate: number
}

interface Invoice {
  id: string
  invoice_number: string
  client: { id: string; name: string }
  client_name?: string
  project: { id: string; name: string }
  project_name?: string
  amount: string
  status: string
  due_date: string
  issue_date?: string
}

interface Expense {
  id: string
  description: string
  category: string
  amount: string
  date: string
  project: { id: string; name: string }
  project_name?: string
  status: string
  priority?: string
}

interface ApiResponse<T> {
  results?: T[]
  data?: T[]
}

const invoiceStatusColors: { [key: string]: string } = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200",
}

const invoiceStatusLabels: { [key: string]: string } = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
}

const expenseStatusColors: { [key: string]: string } = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200",
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200",
  under_review: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200",
}

const expenseStatusLabels: { [key: string]: string } = {
  draft: "Brouillon",
  submitted: "Soumise",
  under_review: "En révision",
  approved: "Approuvée",
  rejected: "Rejetée",
}

export function FinanceOverview() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    draftInvoices: 0,
    totalExpensesCount: 0,
    approvedExpenses: 0,
    pendingExpenses: 0,
    rejectedExpenses: 0,
    profitMargin: 0,
    expenseRate: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadFinanceStats()
    } else if (!authLoading && !user) {
      setLoading(false)
      setError("Authentification requise. Veuillez vous connecter.")
    }
  }, [user, authLoading])

  const loadFinanceStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Charger les données depuis l'API
      const [invoicesData, expensesData] = await Promise.all([
        api.invoices.list(),
        api.expenses.list()
      ])

      // Handle different response formats
      const invoicesDataTyped = invoicesData as ApiResponse<Invoice> | Invoice[]
      const expensesDataTyped = expensesData as ApiResponse<Expense> | Expense[]
      
      const invoices = Array.isArray(invoicesDataTyped) ? invoicesDataTyped : 
                      invoicesDataTyped?.results || invoicesDataTyped?.data || []
      const expenses = Array.isArray(expensesDataTyped) ? expensesDataTyped : 
                      expensesDataTyped?.results || expensesDataTyped?.data || []

      // Trier par date pour obtenir les plus récents
      const sortedInvoices = [...invoices].sort((a: Invoice, b: Invoice) => 
        new Date(b.issue_date || b.due_date).getTime() - new Date(a.issue_date || a.due_date).getTime()
      ).slice(0, 5)
      
      const sortedExpenses = [...expenses].sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5)

      // Statistiques des factures
      const paidInvoices = invoices.filter((inv: Invoice) => inv.status === "paid")
      const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === "sent" || inv.status === "overdue")
      const overdueInvoices = invoices.filter((inv: Invoice) => inv.status === "overdue")
      const draftInvoices = invoices.filter((inv: Invoice) => inv.status === "draft")

      // Statistiques des dépenses
      const approvedExpenses = expenses.filter((exp: Expense) => exp.status === "approved")
      const pendingExpenses = expenses.filter((exp: Expense) => exp.status === "submitted" || exp.status === "under_review")
      const rejectedExpenses = expenses.filter((exp: Expense) => exp.status === "rejected")

      // Calculer les statistiques financières
      const totalRevenue = paidInvoices.reduce((sum: number, inv: Invoice) => {
        const amount = parseFloat(inv.amount) || 0
        return sum + amount
      }, 0)

      const totalExpenses = approvedExpenses.reduce((sum: number, exp: Expense) => {
        const amount = parseFloat(exp.amount) || 0
        return sum + amount
      }, 0)

      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      const expenseRate = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingInvoices: pendingInvoices.length,
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        overdueInvoices: overdueInvoices.length,
        draftInvoices: draftInvoices.length,
        totalExpensesCount: expenses.length,
        approvedExpenses: approvedExpenses.length,
        pendingExpenses: pendingExpenses.length,
        rejectedExpenses: rejectedExpenses.length,
        profitMargin,
        expenseRate,
      })

      setRecentInvoices(sortedInvoices)
      setRecentExpenses(sortedExpenses)
    } catch (error: any) {
      console.error("Erreur lors du chargement des statistiques financières :", error)
      setError(error.message || "Échec du chargement des données financières")
      // Set default stats on error
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingInvoices: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        draftInvoices: 0,
        totalExpensesCount: 0,
        approvedExpenses: 0,
        pendingExpenses: 0,
        rejectedExpenses: 0,
        profitMargin: 0,
        expenseRate: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' GNF'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-sm">Veuillez vous connecter pour voir les données financières</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="space-y-6">
      {/* Cartes principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus Totaux</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">{stats.paidInvoices} factures payées</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-red-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dépenses Totales</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(stats.totalExpenses)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Receipt className="h-3 w-3 text-red-600" />
              <p className="text-xs text-muted-foreground">{stats.approvedExpenses} dépenses approuvées</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice Net</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(stats.netProfit)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {stats.netProfit >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <p className="text-xs text-muted-foreground">
                Marge: {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-yellow-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Factures en Attente</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <p className="text-xs text-muted-foreground">{stats.overdueInvoices} en retard</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deuxième rangée - Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Répartition des factures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Répartition des Factures
            </CardTitle>
            <CardDescription>État actuel des {stats.totalInvoices} factures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payées</span>
                <span className="font-medium">{stats.paidInvoices}</span>
              </div>
              <Progress value={stats.totalInvoices > 0 ? (stats.paidInvoices / stats.totalInvoices) * 100 : 0} className="h-2 bg-green-100" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Envoyées</span>
                <span className="font-medium">{stats.pendingInvoices - stats.overdueInvoices}</span>
              </div>
              <Progress value={stats.totalInvoices > 0 ? ((stats.pendingInvoices - stats.overdueInvoices) / stats.totalInvoices) * 100 : 0} className="h-2 bg-blue-100" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En retard</span>
                <span className="font-medium text-red-600">{stats.overdueInvoices}</span>
              </div>
              <Progress value={stats.totalInvoices > 0 ? (stats.overdueInvoices / stats.totalInvoices) * 100 : 0} className="h-2 bg-red-100" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Brouillons</span>
                <span className="font-medium">{stats.draftInvoices}</span>
              </div>
              <Progress value={stats.totalInvoices > 0 ? (stats.draftInvoices / stats.totalInvoices) * 100 : 0} className="h-2 bg-gray-100" />
            </div>
          </CardContent>
        </Card>

        {/* Répartition des dépenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-600" />
              Répartition des Dépenses
            </CardTitle>
            <CardDescription>État actuel des {stats.totalExpensesCount} dépenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approuvées</span>
                <span className="font-medium">{stats.approvedExpenses}</span>
              </div>
              <Progress value={stats.totalExpensesCount > 0 ? (stats.approvedExpenses / stats.totalExpensesCount) * 100 : 0} className="h-2 bg-green-100" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En attente</span>
                <span className="font-medium">{stats.pendingExpenses}</span>
              </div>
              <Progress value={stats.totalExpensesCount > 0 ? (stats.pendingExpenses / stats.totalExpensesCount) * 100 : 0} className="h-2 bg-yellow-100" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rejetées</span>
                <span className="font-medium text-red-600">{stats.rejectedExpenses}</span>
              </div>
              <Progress value={stats.totalExpensesCount > 0 ? (stats.rejectedExpenses / stats.totalExpensesCount) * 100 : 0} className="h-2 bg-red-100" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Taux de dépenses</span>
                <span className={`font-bold ${stats.expenseRate > 80 ? 'text-red-600' : stats.expenseRate > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.expenseRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.expenseRate > 80 ? '⚠️ Taux de dépenses élevé' : stats.expenseRate > 50 ? '⚡ Surveillez vos dépenses' : '✅ Situation financière saine'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aperçu santé financière */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Santé Financière
            </CardTitle>
            <CardDescription>Indicateurs clés de performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stats.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {stats.netProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Rentabilité</p>
                <p className={`text-lg font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.netProfit >= 0 ? 'Bénéficiaire' : 'Déficitaire'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stats.profitMargin >= 20 ? 'bg-green-100 dark:bg-green-900' : stats.profitMargin >= 10 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <PiggyBank className={`h-5 w-5 ${stats.profitMargin >= 20 ? 'text-green-600' : stats.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Marge Bénéficiaire</p>
                <p className={`text-lg font-bold ${stats.profitMargin >= 20 ? 'text-green-600' : stats.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stats.pendingInvoices === 0 ? 'bg-green-100 dark:bg-green-900' : stats.overdueInvoices === 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <Clock className={`h-5 w-5 ${stats.pendingInvoices === 0 ? 'text-green-600' : stats.overdueInvoices === 0 ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Factures à Suivre</p>
                <p className={`text-lg font-bold ${stats.pendingInvoices === 0 ? 'text-green-600' : stats.overdueInvoices === 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.pendingInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Troisième rangée - Listes récentes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dernières factures */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Dernières Factures
            </CardTitle>
            <CardDescription>Les 5 factures les plus récentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune facture enregistrée</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{invoice.client_name || invoice.client?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{parseFloat(invoice.amount).toLocaleString('fr-FR')} GNF</p>
                      <Badge variant="outline" className={invoiceStatusColors[invoice.status]}>
                        {invoiceStatusLabels[invoice.status] || invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dernières dépenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-600" />
              Dernières Dépenses
            </CardTitle>
            <CardDescription>Les 5 dépenses les plus récentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune dépense enregistrée</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[150px]">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{parseFloat(expense.amount).toLocaleString('fr-FR')} GNF</p>
                      <Badge variant="outline" className={expenseStatusColors[expense.status]}>
                        {expenseStatusLabels[expense.status] || expense.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
