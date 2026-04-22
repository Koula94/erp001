"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Eye
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { OperationFormDialog } from "./operation-form-dialog"
import { OperationDetailDialog, type Operation } from "./operation-detail-dialog"
import { CATEGORY_OPTIONS, getCategoryName, getCategoryColor } from "@/lib/categories"

const statusColors: { [key: string]: string } = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  validated: "bg-green-500/10 text-green-700 dark:text-green-400",
  paid: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
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

const categoryLabels: { [key: string]: string } = {
  materials: "Matériaux",
  labor: "Main d'œuvre",
  equipment: "Équipement",
  transport: "Transport",
  utilities: "Services",
  consulting: "Consulting",
  software: "Logiciels",
  other: "Autre",
}

interface OperationRequest {
  id: string
  reference: string
  project?: { id: string; name: string }
  project_name?: string
  task_name: string
  requester: { id: string; name: string }
  request_date: string
  period: string
  total_amount: number
  description: string
  status: string
  category: string
  subcategory: string
  validated_by?: { id: string; name: string }
  validation_date?: string
  rejection_reason?: string
  payment_proof?: string
  payment_proof_url?: string
  created_at: string
  updated_at: string
}

interface OperationStats {
  totalOperations: number
  totalAmount: number
  pendingOperations: number
  validatedOperations: number
  rejectedOperations: number
  paidOperations: number
  averageAmount: number
  byCategory: { [key: string]: number }
  byStatus: { [key: string]: number }
  byPeriod: { [key: string]: number }
}

export function OperationsDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const [operations, setOperations] = useState<OperationRequest[]>([])
  const [stats, setStats] = useState<OperationStats>({
    totalOperations: 0,
    totalAmount: 0,
    pendingOperations: 0,
    validatedOperations: 0,
    rejectedOperations: 0,
    paidOperations: 0,
    averageAmount: 0,
    byCategory: {},
    byStatus: {},
    byPeriod: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<OperationRequest | null>(null)
  const [timeRange, setTimeRange] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    if (!authLoading && user) {
      loadOperations()
    } else if (!authLoading && !user) {
      setLoading(false)
      setError("Authentication required. Please log in.")
    }
  }, [user, authLoading, timeRange, statusFilter, categoryFilter])

  const loadOperations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Vérifier si l'utilisateur est authentifié
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/login'
        return
      }
      
      const response = await api.get('/finance/operation-requests/') as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      
      // Appliquer les filtres
      let filteredData = data as OperationRequest[]
      
      // Filtrer par période
      if (timeRange !== "all") {
        const now = new Date()
        const cutoffDate = new Date()
        
        switch (timeRange) {
          case "today":
            cutoffDate.setDate(now.getDate() - 1)
            break
          case "week":
            cutoffDate.setDate(now.getDate() - 7)
            break
          case "month":
            cutoffDate.setMonth(now.getMonth() - 1)
            break
          case "quarter":
            cutoffDate.setMonth(now.getMonth() - 3)
            break
          case "year":
            cutoffDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        filteredData = filteredData.filter(op => {
          const opDate = new Date(op.request_date || op.created_at)
          return opDate >= cutoffDate
        })
      }
      
      // Filtrer par statut
      if (statusFilter !== "all") {
        filteredData = filteredData.filter(op => op.status === statusFilter)
      }
      
      // Filtrer par catégorie
      if (categoryFilter !== "all") {
        filteredData = filteredData.filter(op => op.category === categoryFilter)
      }
      
      setOperations(filteredData)
      calculateStats(filteredData)
      
    } catch (err: any) {
      console.error("Error loading operation requests:", err)
      setError(`Échec du chargement des opérations: ${err?.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: OperationRequest[]) => {
    const totalOperations = data.length
    
    // Calculer le montant total en s'assurant que chaque valeur est un nombre valide
    const totalAmount = data.reduce((sum, op) => {
      const amount = Number(op.total_amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    
    // Calculer la moyenne en évitant la division par zéro
    const averageAmount = totalOperations > 0 ? totalAmount / totalOperations : 0
    
    const byCategory: { [key: string]: number } = {}
    const byStatus: { [key: string]: number } = {}
    const byPeriod: { [key: string]: number } = {}
    
    let pendingOperations = 0
    let validatedOperations = 0
    let rejectedOperations = 0
    let paidOperations = 0
    
    data.forEach(op => {
      // Statistiques par catégorie
      const category = op.category || "other"
      byCategory[category] = (byCategory[category] || 0) + 1
      
      // Statistiques par statut
      byStatus[op.status] = (byStatus[op.status] || 0) + 1
      
      // Statistiques par période
      byPeriod[op.period] = (byPeriod[op.period] || 0) + 1
      
      // Compteurs de statut
      switch (op.status) {
        case "draft":
        case "submitted":
          pendingOperations++
          break
        case "validated":
          validatedOperations++
          break
        case "rejected":
          rejectedOperations++
          break
        case "paid":
          paidOperations++
          break
      }
    })
    
    setStats({
      totalOperations,
      totalAmount,
      pendingOperations,
      validatedOperations,
      rejectedOperations,
      paidOperations,
      averageAmount,
      byCategory,
      byStatus,
      byPeriod
    })
  }

  const handleOperationSubmit = () => {
    setIsFormOpen(false)
    loadOperations()
  }

  const formatCurrency = (amount: number) => {
    // Vérifier si le montant est un nombre valide
    if (isNaN(amount) || !isFinite(amount)) {
      return "0 GNF"
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Convert OperationRequest to Operation for the detail dialog
  const convertToOperation = (op: OperationRequest | null): Operation | null => {
    if (!op) return null
    
    return {
      id: op.id,
      reference: op.reference,
      status: op.status,
      created_at: op.created_at,
      updated_at: op.updated_at,
      task_name: op.task_name,
      period: op.period,
      requester: op.requester,
      validated_by: op.validated_by,
      validation_date: op.validation_date,
      rejection_reason: op.rejection_reason,
      payment_proof_url: op.payment_proof_url,
      // Convert payment_proof string to boolean (true if payment_proof_url exists)
      payment_proof: !!op.payment_proof_url,
      project: op.project,
      project_name: op.project_name,
      category: op.category,
      categories: op.category ? op.category.split(',').map(c => c.trim()) : null,
      total_amount: Number(op.total_amount),
      description: op.description,
      subcategory: op.subcategory,
      subcategories: op.subcategory
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Clock className="h-4 w-4" />
      case "submitted": return <Send className="h-4 w-4" />
      case "validated": return <CheckCircle className="h-4 w-4" />
      case "paid": return <DollarSign className="h-4 w-4" />
      case "rejected": return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Brouillon"
      case "submitted": return "Soumis"
      case "validated": return "Validé"
      case "paid": return "Payé"
      case "rejected": return "Rejeté"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-5 w-5" />
          <h3 className="font-semibold">Erreur</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={loadOperations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord des Opérations</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des demandes d'opération et statistiques
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadOperations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Opération
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="quarter">3 derniers mois</SelectItem>
                  <SelectItem value="year">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="submitted">Soumis</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartes de statistiques - 3 cartes en haut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Carte 1: Total des Opérations */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Total des Opérations</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOperations}</div>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{stats.pendingOperations} en attente</span>
              
            </div>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
            <span>{stats.rejectedOperations}</span>
              <span className="ml-1">rejetées</span>
              </div>
          </CardContent>
        </Card>
        
        {/* Carte 2: Montant Total */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Moyenne: {formatCurrency(stats.averageAmount)}
              </span>
             <span className="flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />

             Taux de Validation : {stats.totalOperations > 0 ? Math.round(((stats.validatedOperations + stats.paidOperations) / stats.totalOperations) * 100) : 0}%
             
            </span>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Carte 3: Validées & Payées */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Validées & Payées</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Section Validées */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium">Validées en cours</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{stats.validatedOperations}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalOperations > 0 ? Math.round((stats.validatedOperations / stats.totalOperations) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${stats.totalOperations > 0 ? (stats.validatedOperations / stats.totalOperations) * 100 : 0}%` }}
                />
              </div>
            </div>
            
            {/* Section Payées */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-medium">Payées</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{stats.paidOperations}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalOperations > 0 ? Math.round((stats.paidOperations / stats.totalOperations) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${stats.totalOperations > 0 ? (stats.paidOperations / stats.totalOperations) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  
    

      {/* Tableau des opérations récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Opérations récentes
          </CardTitle>
          <CardDescription>
            {operations.length} opération{operations.length !== 1 ? 's' : ''} trouvée{operations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  {/* <TableHead>Catégorie</TableHead> */}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.slice(0, 10).map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell className="font-medium">{operation.reference}</TableCell>
                    <TableCell>{operation.task_name}</TableCell>
                    <TableCell>
                      {operation.project?.name || operation.project_name || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(operation.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[operation.status]} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(operation.status)}
                        {getStatusLabel(operation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(operation.request_date || operation.created_at)}</TableCell>
                    {/* <TableCell>
                      <span className="text-sm">
                        {categoryLabels[operation.category] || operation.category || "Non spécifiée"}
                      </span>
                    </TableCell> */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOperation(operation)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {operations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune opération trouvée avec les filtres actuels
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {operations.length > 10 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                Voir toutes les opérations ({operations.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques par catégorie et statut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/50"></div>
                    <span className="text-sm">
                      {categoryLabels[category] || category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats.totalOperations > 0 ? Math.round((count / stats.totalOperations) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.byCategory).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune donnée de catégorie disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm">{getStatusLabel(status)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats.totalOperations > 0 ? Math.round((count / stats.totalOperations) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(stats.byStatus).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune donnée de statut disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de création d'opération */}
      <OperationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleOperationSubmit}
      />

      {/* Dialogue de détail d'opération */}
      <OperationDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        operation={convertToOperation(selectedOperation)}
      />
    </div>
  )
}
