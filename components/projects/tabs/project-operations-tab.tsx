"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Plus, Pencil, Eye } from "lucide-react"
import { OperationRequest, OperationStats } from "@/lib/project-types"

const operationStatusColors: { [key: string]: string } = {
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

function formatCurrency(amount: number) {
  try {
    if (amount === null || amount === undefined) return "GNF 0"
    const num = typeof amount === "string" ? parseFloat(amount) : Number(amount)
    if (isNaN(num) || !isFinite(num)) return "GNF 0"
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "GNF" }).format(num)
  } catch {
    return "GNF 0"
  }
}

interface ProjectOperationsTabProps {
  operations: OperationRequest[]
  stats: OperationStats
  onAdd: () => void
  onEdit: (operation: OperationRequest) => void
  onDelete: (operationId: string) => void
  onWorkflowAction: (operationId: string, action: string, data?: any) => void
  onViewDetail: (operation: OperationRequest) => void
}

export function ProjectOperationsTab({
  operations,
  stats,
  onAdd,
  onEdit,
  onDelete,
  onWorkflowAction,
  onViewDetail,
}: ProjectOperationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">📝 Total Demandé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.total_demande)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.total_count} opérations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">✅ Total Validé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.total_valide)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.valide_count} opérations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">💸 Total Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.total_paye)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.paye_count} opérations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">⏳ Reste à Payer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.reste_a_payer)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.en_attente_count} en attente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Opérations du Projet</CardTitle>
              <CardDescription>Gérez les demandes d'opération financière pour ce projet</CardDescription>
            </div>
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Opération
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune opération enregistrée pour ce projet</p>
              <p className="text-sm">Créez votre première demande d'opération pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell className="font-mono text-sm">{operation.reference}</TableCell>
                    <TableCell className="font-medium max-w-48 truncate">{operation.task_name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(operation.total_amount)}</TableCell>
                    <TableCell>{new Date(operation.request_date).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={operationStatusColors[operation.status]}>
                        {operation.status === "draft" && "Brouillon"}
                        {operation.status === "submitted" && "Soumis"}
                        {operation.status === "validated" && "Validé"}
                        {operation.status === "paid" && "Payé"}
                        {operation.status === "rejected" && "Rejeté"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetail(operation)}>
                            <Eye className="h-4 w-4 mr-1" />
                        </Button>
                        {operation.status === "draft" && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(operation)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {operation.status === "draft" && (
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => onWorkflowAction(operation.id, "submit")}>
                            Soumettre
                          </Button>
                        )}
                        {operation.status === "submitted" && (
                          <>
                            <Button variant="outline" size="sm" className="text-xs bg-green-500/10 text-green-700 hover:bg-green-500/20" onClick={() => onWorkflowAction(operation.id, "validate")}>
                              Valider
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs bg-red-500/10 text-red-700 hover:bg-red-500/20" onClick={() => {
                              const reason = prompt("Raison du rejet:")
                              if (reason) onWorkflowAction(operation.id, "reject", { rejection_reason: reason })
                            }}>
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
    </div>
  )
}
