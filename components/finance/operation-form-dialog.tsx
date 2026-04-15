"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface OperationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
  projectId?: string
  projectName?: string
}

export function OperationFormDialog({ open, onOpenChange, onSubmit, initialData, projectId, projectName }: OperationFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      task_name: "",
      project: projectId || "",
      period: "one_time",
      total_amount: 0,
      description: "",
      status: "draft",
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier la demande d'opération" : "Nouvelle Demande d'Opération"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Mettre à jour les informations de la demande" : "Créer une nouvelle demande d'opération financière"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task_name">Nom de Tâche *</Label>
              <Input
                id="task_name"
                value={formData.task_name}
                onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                required
                placeholder="Nom de la tâche ou opération"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projet</Label>
                {projectName ? (
                  <div className="space-y-1">
                    <Input
                      id="project"
                      value={projectName}
                      readOnly
                      className="bg-muted"
                    />
                    <Input
                      type="hidden"
                      value={projectId}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Projet associé automatiquement</p>
                  </div>
                ) : (
                  <>
                    <Input
                      id="project"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      placeholder="ID du projet associé"
                    />
                    <p className="text-xs text-muted-foreground">Laissez vide si pas de projet associé</p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Période *</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                    <SelectItem value="one_time">Ponctuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Montant total demandé (GNF) *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="submitted">Soumis</SelectItem>
                    <SelectItem value="validated">Validé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Motif / Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Décrivez en détail le motif de cette demande d'opération..."
                rows={4}
              />
            </div>

            {initialData?.status === 'rejected' && initialData?.rejection_reason && (
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Raison du rejet</Label>
                <Textarea
                  id="rejection_reason"
                  value={initialData.rejection_reason}
                  readOnly
                  rows={2}
                  className="bg-muted"
                />
              </div>
            )}

            {initialData?.status === 'validated' && initialData?.validation_date && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validation_date">Date de validation</Label>
                  <Input
                    id="validation_date"
                    type="date"
                    value={initialData.validation_date}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validated_by">Validé par</Label>
                  <Input
                    id="validated_by"
                    value={initialData.validated_by?.name || "N/A"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{initialData ? "Mettre à jour" : "Enregistrer"} la demande</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}