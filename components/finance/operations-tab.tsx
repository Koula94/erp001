"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Edit, Trash2, Loader2, CheckCircle, XCircle, Send } from "lucide-react"
import { api } from "@/lib/api"
import { OperationFormDialog } from "./operation-form-dialog"
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

export function OperationsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [operations, setOperations] = useState<OperationRequest[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOperation, setEditingOperation] = useState<OperationRequest | null>(null)
  const [deletingOperationId, setDeletingOperationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOperations()
  }, [])

  const loadOperations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/finance/operation-requests/') as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setOperations(data as OperationRequest[])
      setError(null)
    } catch (err) {
      setError("Failed to load operation requests")
      console.error("Error loading operation requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOperations = operations.filter(
    (operation) =>
      (operation.task_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (operation.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (operation.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSaveOperation = async (operationData: any) => {
    try {
      if (editingOperation) {
        // Update existing operation
        const updatedOperation = await api.put(`/finance/operation-requests/${editingOperation.id}/`, operationData) as OperationRequest
        setOperations(operations.map((o) => (o.id === editingOperation.id ? updatedOperation : o)))
      } else {
        // Create new operation
        const newOperation = await api.post('/finance/operation-requests/', operationData) as OperationRequest
        setOperations([...operations, newOperation])
      }
      setEditingOperation(null)
    } catch (err) {
      setError("Failed to save operation request")
      console.error("Error saving operation request:", err)
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
        case 'reject':
          response = await api.post(`/finance/operation-requests/${operationId}/reject/`, data || {})
          break
        default:
          throw new Error(`Action non supportée: ${action}`)
      }
      
      if (response.id) {
        // Update local state
        setOperations(operations.map((o) => (o.id === operationId ? response : o)))
        
        // Show success message
        alert(`✅ Action "${action}" effectuée avec succès`)
      } else {
        throw new Error(response.error || "Action failed")
      }
    } catch (err) {
      setError(`Failed to process workflow action: ${err}`)
      console.error("Error processing workflow action:", err)
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
      setError("Failed to delete operation request")
      console.error("Error deleting operation request:", err)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des opérations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditingOperation(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Opération
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Demandes d'Opération</CardTitle>
          <CardDescription>Gérez le workflow complet des demandes d'opération financière</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? "Aucune opération trouvée" : "Aucune demande d'opération enregistrée"}</p>
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
                    <TableCell>{formatDate(operation.request_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {operation.project?.name || "Sans projet"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[operation.status]}>
                        {operation.status === 'draft' && 'Brouillon'}
                        {operation.status === 'submitted' && 'Soumis'}
                        {operation.status === 'validated' && 'Validé'}
                        {operation.status === 'rejected' && 'Rejeté'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditOperation(operation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}