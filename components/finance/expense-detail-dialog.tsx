"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { getCategoryName, getCategoryColor } from "@/lib/categories"
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  FolderKanban,
  Tag,
  Receipt,
  Loader2,
  ChevronRight,
  Paperclip,
} from "lucide-react"

interface ExpenseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseId: string | null
}

interface WorkflowAction {
  action: string
  label: string
  type: string
}

interface WorkflowStatus {
  name: string
  description: string
  next_actions: string[]
  color: string
}

interface ExpenseDetail {
  id: string
  description: string
  category: string
  subcategory?: string
  subcategories?: Array<{ name: string; amount: number }>
  amount: number
  date: string
  status: string
  priority: string
  project?: { id: string; name: string }
  submitted_by?: { id: string; name: string; username?: string }
  approved_by?: { id: string; name: string; username?: string }
  paid_by?: { id: string; name: string; username?: string }
  payment_date?: string
  notes?: string
  receipt?: string
  receipt_url?: string
  fund_source?: string
  created_at: string
  updated_at: string
  workflow_status?: WorkflowStatus
  available_actions?: WorkflowAction[]
}

const statusColors: { [key: string]: string } = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200",
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200",
  under_review: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200",
}

const statusLabels: { [key: string]: string } = {
  draft: "Brouillon",
  submitted: "Soumis",
  under_review: "En révision",
  approved: "Approuvé",
  rejected: "Rejeté",
}

const priorityColors: { [key: string]: string } = {
  low: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200",
}

const priorityLabels: { [key: string]: string } = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
}

const fundSourceLabels: { [key: string]: string } = {
  project_budget: "Budget projet",
  operation_cash: "Caisse opérations",
  emergency_fund: "Fonds d'urgence",
  other: "Autre",
}

export function ExpenseDetailDialog({ open, onOpenChange, expenseId }: ExpenseDetailDialogProps) {
  const [expense, setExpense] = useState<ExpenseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && expenseId) {
      loadExpenseDetail(expenseId)
    } else {
      setExpense(null)
    }
  }, [open, expenseId])

  const loadExpenseDetail = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Charger les détails de la dépense
      const expenseData = await api.get<any>(`/finance/expenses/${id}/`)

      // Charger le statut du workflow et les actions disponibles
      let workflowStatus = null
      let availableActions: WorkflowAction[] = []

      try {
        const workflowData = await api.get<any>(`/finance/expenses/${id}/workflow/status/`)
        if (workflowData.success) {
          workflowStatus = workflowData.workflow_status
        }
      } catch (e) {
        // Ignorer l'erreur si l'endpoint n'existe pas
      }

      try {
        const actionsData = await api.get<any>(`/finance/expenses/${id}/workflow/actions/`)
        if (actionsData.success) {
          availableActions = actionsData.available_actions || []
        }
      } catch (e) {
        // Ignorer l'erreur si l'endpoint n'existe pas
      }

      // Normaliser les données du projet
      let projectData = null
      if (expenseData.project) {
        if (typeof expenseData.project === 'object' && !Array.isArray(expenseData.project)) {
          projectData = {
            id: String(expenseData.project.id),
            name: expenseData.project.name || 'Sans projet'
          }
        } else if (expenseData.project) {
          projectData = {
            id: String(expenseData.project),
            name: expenseData.project_name || 'Sans projet'
          }
        }
      }

      setExpense({
        id: expenseData.id,
        description: expenseData.description,
        category: expenseData.category,
        subcategory: expenseData.subcategory,
        subcategories: expenseData.subcategories || [],
        amount: parseFloat(expenseData.amount),
        date: expenseData.date,
        status: expenseData.status,
        priority: expenseData.priority || 'medium',
        project: projectData || undefined,
        submitted_by: expenseData.submitted_by ? {
          id: String(expenseData.submitted_by),
          name: expenseData.submitted_by_name || expenseData.submitted_by_username || 'Utilisateur',
          username: expenseData.submitted_by_username
        } : undefined,
        approved_by: expenseData.approved_by ? {
          id: String(expenseData.approved_by),
          name: expenseData.approved_by_name || expenseData.approved_by_username || 'Utilisateur',
          username: expenseData.approved_by_username
        } : undefined,
        paid_by: expenseData.paid_by ? {
          id: String(expenseData.paid_by),
          name: expenseData.paid_by_name || expenseData.paid_by_username || 'Utilisateur',
          username: expenseData.paid_by_username
        } : undefined,
        payment_date: expenseData.payment_date,
        notes: expenseData.notes,
        receipt: expenseData.receipt,
        receipt_url: expenseData.receipt_url,
        fund_source: expenseData.fund_source || 'project_budget',
        created_at: expenseData.created_at,
        updated_at: expenseData.updated_at,
        workflow_status: workflowStatus || undefined,
        available_actions: availableActions.length > 0 ? availableActions : undefined,
      })
    } catch (err) {
      setError("Erreur lors du chargement des détails de la dépense")
      console.error("Erreur lors du chargement des détails de la dépense :", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Détails de la dépense
          </DialogTitle>
          <DialogDescription>
            {expense ? `Référence #${expense.id}` : "Chargement..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        ) : expense ? (
          <div className="space-y-6">
            {/* En-tête avec statut et priorité */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={statusColors[expense.status]}>
                {statusLabels[expense.status] || expense.status}
              </Badge>
              <Badge variant="outline" className={priorityColors[expense.priority]}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {priorityLabels[expense.priority] || expense.priority}
              </Badge>
              {expense.fund_source && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200">
                  {fundSourceLabels[expense.fund_source] || expense.fund_source}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{expense.description}</h3>
              {expense.workflow_status && (
                <p className="text-sm text-muted-foreground">
                  {expense.workflow_status.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Montant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {expense.amount.toLocaleString()} GNF
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Date: {formatDate(expense.date)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-blue-600" />
                    Projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {expense.project?.name || "Sans projet"}
                  </p>
                  {expense.project && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {expense.project.id}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Catégories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Catégorisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Catégorie principale:</span>
                  <Badge variant="outline" className={getCategoryColor(expense.category)}>
                    {getCategoryName(expense.category)}
                  </Badge>
                </div>

                {expense.subcategories && expense.subcategories.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Sous-catégories:</span>
                    <div className="space-y-2">
                      {expense.subcategories.map((sc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <span className="text-sm font-medium">{sc.name}</span>
                          <span className="text-sm font-semibold">
                            {sc.amount.toLocaleString()} GNF
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-bold text-green-600">
                        {expense.subcategories.reduce((sum, sc) => sum + sc.amount, 0).toLocaleString()} GNF
                      </span>
                    </div>
                  </div>
                ) : expense.subcategory ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sous-catégorie:</span>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                      {expense.subcategory}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune sous-catégorie</p>
                )}
              </CardContent>
            </Card>

            {/* Traçabilité */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Traçabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Créé le</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(expense.created_at)}</p>
                  </div>
                </div>
                {expense.submitted_by && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Soumis par</p>
                      <p className="text-sm text-muted-foreground">{expense.submitted_by.name}</p>
                    </div>
                  </div>
                )}
                {expense.approved_by && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approuvé par</p>
                      <p className="text-sm text-muted-foreground">{expense.approved_by.name}</p>
                    </div>
                  </div>
                )}
                {expense.paid_by && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payé par</p>
                      <p className="text-sm text-muted-foreground">{expense.paid_by.name}</p>
                    </div>
                  </div>
                )}
                {expense.payment_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Date de paiement</p>
                      <p className="text-sm text-muted-foreground">{formatDate(expense.payment_date)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {expense.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes internes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {expense.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Justificatif */}
            {expense.receipt_url && (
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>
                    Justificatif attaché
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Un reçu ou justificatif est associé à cette dépense.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fichier: {expense.receipt_url.split('/').pop()?.split('?')[0]}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 border-green-300 hover:bg-green-100 dark:hover:bg-green-900" asChild>
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Paperclip className="h-4 w-4" />
                        Justificatif
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions disponibles */}
            {expense.available_actions && expense.available_actions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Actions disponibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {expense.available_actions.map((action) => (
                      <Button
                        key={action.action}
                        variant={action.type === 'danger' ? 'destructive' : action.type === 'secondary' ? 'outline' : 'default'}
                        size="sm"
                        disabled
                        title="Action disponible dans le tableau principal"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les actions doivent être effectuées depuis le tableau des dépenses.
                  </p>
                </div>
              </>
            )}

            {/* Pied de page */}
            <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
              <span>Dernière mise à jour: {formatDateTime(expense.updated_at)}</span>
              <span>ID: {expense.id}</span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
