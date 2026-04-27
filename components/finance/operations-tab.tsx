"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Edit, Trash2, Loader2, CheckCircle, XCircle, Send, CreditCard, Paperclip, Eye, DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, Filter, X } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { OperationFormDialog } from "./operation-form-dialog"
import { OperationDetailDialog, type Operation } from "./operation-detail-dialog"
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
  validated_by?: { id: string; name: string }
  validation_date?: string
  rejection_reason?: string
  payment_proof?: string
  payment_proof_url?: string
  quote_url?: string
  created_at: string
  updated_at: string
}

export function OperationsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [operations, setOperations] = useState<OperationRequest[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<OperationRequest | null>(null)
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<OperationRequest | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { handleError } = useErrorHandler()

  useEffect(() => {
    loadOperations()

    // Auto-refresh silencieux en arrière-plan toutes les 10 secondes
    const interval = setInterval(() => {
      loadOperations(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const loadOperations = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      
      // Vérifier si l'utilisateur est authentifié
      const token = localStorage.getItem('access_token')
      if (!token) {
        // Rediriger vers la page de login
        window.location.href = '/login'
        return
      }
      
      const response = await api.get('/finance/operation-requests/') as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setOperations(data as OperationRequest[])
      setError(null)
    } catch (err: any) {
      handleError(err, "Chargement des opérations")
      setError(`Échec du chargement des opérations: ${err?.message || 'Erreur inconnue'}`)
      
      // Rediriger vers la page de login si non authentifié
      if (err?.status === 401) {
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredOperations = operations.filter((operation) => {
    const matchesSearch =
      (operation.task_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (operation.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (operation.description || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || operation.status === statusFilter
    const matchesPeriod = periodFilter === "all" || operation.period === periodFilter

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const hasActiveFilters = statusFilter !== "all" || periodFilter !== "all" || searchQuery !== ""

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPeriodFilter("all")
  }

  const handleSaveOperation = async (operationData: any) => {
    try {
      const quoteFile = operationData.quoteFile
      delete operationData.quoteFile
      
      if (editingOperation) {
        // Update existing operation
        if (quoteFile) {
          // Utiliser FormData pour envoyer le fichier
          const formData = new FormData()
          Object.entries(operationData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value))
            }
          })
          formData.append('quote', quoteFile)
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/finance/operation-requests/${editingOperation.id}/`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
          }
          
          const updatedOperation = await response.json() as OperationRequest
          setOperations(operations.map((o) => (o.id === editingOperation.id ? updatedOperation : o)))
        } else {
          const updatedOperation = await api.put(`/finance/operation-requests/${editingOperation.id}/`, operationData) as OperationRequest
          setOperations(operations.map((o) => (o.id === editingOperation.id ? updatedOperation : o)))
        }
        toast({
          title: "Opération mise à jour",
          description: "La demande d'opération a été modifiée avec succès.",
        })
      } else {
        // Create new operation
        if (quoteFile) {
          // Utiliser FormData pour envoyer le fichier
          const formData = new FormData()
          Object.entries(operationData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value))
            }
          })
          formData.append('quote', quoteFile)
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/finance/operation-requests/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
          }
          
          const newOperation = await response.json() as OperationRequest
          setOperations([...operations, newOperation])
        } else {
          const newOperation = await api.post('/finance/operation-requests/', operationData) as OperationRequest
          setOperations([...operations, newOperation])
        }
        toast({
          title: "Opération créée",
          description: "La nouvelle demande d'opération a été enregistrée avec succès.",
        })
      }
      setEditingOperation(null)
    } catch (err: any) {
      handleError(err, "Sauvegarde de l'opération")
      setError("Échec de la sauvegarde de la demande d'opération")
    }
  }

  const handleWorkflowAction = async (operationId: string, action: string, data?: any) => {
    try {
      let response: any
      
      switch (action) {
        case 'submit':
          response = await api.post(`/finance/operation-requests/${operationId}/submit/`, {})
          break
        case 'validate':
          response = await api.post(`/finance/operation-requests/${operationId}/validate/`, data || {})
          break
        case 'pay':
          // Créer un input file pour uploader le justificatif
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
          input.onchange = async (e: any) => {
            const file = e.target.files[0]
            if (!file) return
            
            try {
              // Créer un FormData pour envoyer le fichier
              const formData = new FormData()
              formData.append('payment_proof', file)
              
              // Envoyer la requête avec le fichier - ne PAS définir Content-Type pour FormData
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/finance/operation-requests/${operationId}/pay/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                  // Ne pas définir Content-Type - le navigateur le définit automatiquement avec boundary
                },
                body: formData
              })
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
              }
              
              const data = await response.json()
              
              if (data.id) {
                // Update local state
                setOperations(operations.map((o) => (o.id === operationId ? data : o)))
                
                toast({
                  title: "✅ Paiement effectué",
                  description: `Justificatif téléchargé: ${file.name}`,
                })
              } else {
                throw new Error(data.error || "Action failed")
              }
            } catch (err: any) {
              handleError(err, "Paiement de l'opération")
            }
          }
          input.click()
          return // Retourner ici car l'action est asynchrone via l'input file
        case 'reject':
          response = await api.post(`/finance/operation-requests/${operationId}/reject/`, data || {})
          break
        default:
          throw new Error(`Action non supportée: ${action}`)
      }
      
      if (response.id) {
        // Update local state
        setOperations(operations.map((o) => (o.id === operationId ? response : o)))
        
        const actionLabels: Record<string, string> = {
          submit: 'soumise',
          validate: 'validée',
          reject: 'rejetée',
        }
        toast({
          title: `Opération ${actionLabels[action] || action}`,
          description: `L'action "${action}" a été effectuée avec succès.`,
        })
      } else {
        throw new Error(response.error || "Action failed")
      }
    } catch (err: any) {
      handleError(err, `Action workflow: ${action}`)
    }
  }

  const handleEditOperation = (operation: OperationRequest) => {
    setEditingOperation(operation)
    setIsFormOpen(true)
  }

  const handleDeleteOperation = async (operationId: string) => {
    try {
      await api.delete(`/finance/operation-requests/${operationId}/`)
      setOperations(operations.filter((o) => o.id !== operationId))
      setDeletingOperationId(null)
    } catch (err) {
      setError("Échec de la suppression de la demande d'opération")
      console.error("Erreur lors de la suppression de la demande d'opération :", err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
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
      quote_url: op.quote_url,
      // Convert payment_proof string to boolean (true if payment_proof_url exists)
      payment_proof: !!op.payment_proof_url,
      project: op.project,
      project_name: op.project_name,
      total_amount: Number(op.total_amount),
      description: op.description,

    }
  }

  // Statistiques des opérations
  const totalCount = operations.length
  const totalAmount = operations.reduce((sum, op) => sum + Number(op.total_amount), 0)
  const paidCount = operations.filter((op) => op.status === "paid").length
  const paidAmount = operations
    .filter((op) => op.status === "paid")
    .reduce((sum, op) => sum + Number(op.total_amount), 0)
  const pendingCount = operations.filter((op) => op.status === "submitted" || op.status === "validated").length
  const pendingAmount = operations
    .filter((op) => op.status === "submitted" || op.status === "validated")
    .reduce((sum, op) => sum + Number(op.total_amount), 0)
  const rejectedCount = operations.filter((op) => op.status === "rejected").length
  const rejectedAmount = operations
    .filter((op) => op.status === "rejected")
    .reduce((sum, op) => sum + Number(op.total_amount), 0)

  return (
    <div className="space-y-4">
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-blue-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <div className="flex items-center gap-1 mt-1">
              <FileText className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-muted-foreground">{totalCount} opération{totalCount > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opérations Payées</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">{paidCount} opération{paidCount > 1 ? 's' : ''} payée{paidCount > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-yellow-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Cours</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <p className="text-xs text-muted-foreground">{pendingCount} en attente de paiement</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-red-500/10 rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(rejectedAmount)}</div>
            <div className="flex items-center gap-1 mt-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <p className="text-xs text-muted-foreground">{rejectedCount} opération{rejectedCount > 1 ? 's' : ''} rejetée{rejectedCount > 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Demandes d'Opération</CardTitle>
              <CardDescription>Gérez le workflow complet des demandes d'opération financière</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={showFilters ? "bg-primary/10" : ""}>
                <Filter className="h-4 w-4" />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-destructive hover:text-destructive">
                  <X className="h-4 w-4 mr-1" />Réinitialiser
                </Button>
              )}
              <Button onClick={() => { setEditingOperation(null); setIsFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle
              </Button>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="submitted">Soumis</option>
                  <option value="validated">Validé</option>
                  <option value="paid">Payé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Toutes périodes</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="yearly">Annuel</option>
                  <option value="one_time">Ponctuel</option>
                </select>
              </div>
            </div>
          )}

          {/* Badges de filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-sm text-muted-foreground">
              <span>Filtres:</span>
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter("all")}>
                  Statut: {statusFilter === 'draft' ? 'Brouillon' : statusFilter === 'submitted' ? 'Soumis' : statusFilter === 'validated' ? 'Validé' : statusFilter === 'paid' ? 'Payé' : 'Rejeté'} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {periodFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setPeriodFilter("all")}>
                  Période: {periodLabels[periodFilter] || periodFilter} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                  Recherche: {searchQuery} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              <span className="ml-auto">{filteredOperations.length} résultat(s)</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{hasActiveFilters ? "Aucune opération ne correspond aux filtres" : "Aucune demande d'opération enregistrée"}</p>
              <p className="text-sm">{hasActiveFilters ? "Essayez de modifier vos critères de recherche" : "Créez votre première demande d'opération pour commencer"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell className="font-mono text-sm">
                      {operation.reference}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate ">
                      {operation.task_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(operation.total_amount)}
                    </TableCell>
                    <TableCell>{formatDate(operation.request_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {operation.project_name || operation.project?.name || "Sans objet"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[operation.status]}>
                        {operation.status === 'draft' && 'Brouillon'}
                        {operation.status === 'submitted' && 'Soumis'}
                        {operation.status === 'validated' && 'Validé'}
                        {operation.status === 'paid' && 'Payé'}
                        {operation.status === 'rejected' && 'Rejeté'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Bouton Voir détail - toujours visible */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOperation(operation)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                          </Button>
                          
                          {/* Only show edit button for draft status (can be edited before submission) */}
                          {operation.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => handleEditOperation(operation)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Only show delete button for draft, submitted, or rejected status */}
                          {(operation.status === 'draft' || operation.status === 'submitted' || operation.status === 'rejected') && (
                            <Button variant="ghost" size="icon" onClick={() => setDeletingOperationId(operation.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        {operation.status === 'draft' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleWorkflowAction(operation.id, 'submit')}
                          >
                            <Send className="h-3 w-3 mr-1" />
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
                              <CheckCircle className="h-3 w-3 mr-1" />
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
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}
                        {operation.status === 'validated' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-purple-500/10 text-purple-700 hover:bg-purple-500/20"
                            onClick={() => handleWorkflowAction(operation.id, 'pay')}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Payer
                          </Button>
                        )}
                        {operation.status === 'paid' && operation.payment_proof_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-blue-500/10 text-blue-700 hover:bg-blue-500/20"
                            onClick={() => window.open(operation.payment_proof_url, '_blank')}
                          >
                            <Paperclip className="h-3 w-3 mr-1" />
                            Voir le reçu
                          </Button>
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

      <OperationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveOperation}
        initialData={editingOperation ? {
          project: editingOperation.project?.id,
          task_name: editingOperation.task_name,
          period: editingOperation.period,
          total_amount: editingOperation.total_amount,
          description: editingOperation.description,
          status: editingOperation.status,
        } : undefined}
      />

      <AlertDialog open={!!deletingOperationId} onOpenChange={() => setDeletingOperationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande d'opération ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOperationId && handleDeleteOperation(deletingOperationId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de détail d'opération */}
      <OperationDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        operation={convertToOperation(selectedOperation)}
      />
    </div>
  )
}
