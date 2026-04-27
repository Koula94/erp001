"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Loader2, Upload, FileText, X, Download } from "lucide-react"
import { api } from "@/lib/api"

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
      total_amount: "",
      description: "",
      status: "draft",
    },
  )
  
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quoteFile, setQuoteFile] = useState<File | null>(null)

  // Charger les projets disponibles
  useEffect(() => {
    const fetchProjects = async () => {
      if (projectId) return // Si un projet est déjà fourni, pas besoin de charger la liste
      
      setLoadingProjects(true)
      try {
        const response = await api.get('/projects/projects/') as any
        const data = Array.isArray(response) ? response : response.results || response.data || []
        setProjects(data)
      } catch {
        // Silently fail - projects list is optional
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    if (open) {
      fetchProjects()
    }
  }, [open, projectId])

  // Charger les tâches du projet
  useEffect(() => {
    const fetchTasks = async () => {
      const currentProjectId = formData.project || projectId
      if (!currentProjectId) {
        setTasks([])
        return
      }
      
      setLoadingTasks(true)
      try {
        const response = await api.get(`/projects/tasks/?project=${currentProjectId}`) as any
        const data = Array.isArray(response) ? response : response.results || response.data || []
        setTasks(data)
      } catch {
        setTasks([])
      } finally {
        setLoadingTasks(false)
      }
    }

    if (open && (formData.project || projectId)) {
      fetchTasks()
    }
  }, [open, formData.project, projectId])

  // Reset form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        task_name: "",
        project: projectId || "",
        period: "one_time",
        total_amount: "",
        description: "",
        status: "draft",
      })
    }
  }, [initialData, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSubmitting(true)
    
    const submissionData = {
      ...formData,
      project: formData.project === "none" ? "" : formData.project,
      task_name: formData.task_name === "none" ? "" : formData.task_name,
      total_amount: formData.total_amount === "" ? 0 : Number(formData.total_amount),
      quoteFile: quoteFile, // Passer le fichier devis
    }
    
    try {
      await onSubmit(submissionData)
      onOpenChange(false)
    } catch {
      // Error handling is done by the parent component
    } finally {
      setSubmitting(false)
    }
  }

  // Check if the operation is in a read-only state
  const isReadOnly = initialData && initialData.status !== 'draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isReadOnly ? "Détails de la demande d'opération" : initialData ? "Modifier la demande d'opération" : "Nouvelle Demande d'Opération"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isReadOnly ? "Consultation des détails de la demande (lecture seule)" : initialData ? "Mettre à jour les informations de la demande" : "Créer une nouvelle demande d'opération financière"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-5  overflow-y-auto flex-1 pr-2">
            {/* Section 1: Informations principales */}
            <div className="space-y-5">
              <div className="border-b pb-3" />
              
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task_name" className="font-medium">Tâche *</Label>
                  {projectId ? (
                    <>
                      {loadingTasks ? (
                        <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                          <span className="text-sm text-muted-foreground">Chargement des tâches...</span>
                        </div>
                      ) : tasks.length > 0 ? (
                        <Select
                          value={formData.task_name}
                          onValueChange={(value) => setFormData({ ...formData, task_name: value })}
                          disabled={isReadOnly}
                          required
                        >
                          <SelectTrigger className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}>
                            <SelectValue placeholder="Sélectionner une tâche" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Sélectionner une tâche --</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.title}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            id="task_name"
                            value={formData.task_name}
                            onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                            required
                            placeholder="Nom de la tâche ou opération"
                            readOnly={isReadOnly}
                            className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Aucune tâche disponible pour ce projet. Saisissez manuellement le nom de la tâche.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <Input
                      id="task_name"
                      value={formData.task_name}
                      onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                      required
                      placeholder="Nom de la tâche ou opération"
                      readOnly={isReadOnly}
                      className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project" className="font-medium">Projet</Label>
                    {projectName ? (
                      <div className="space-y-1">
                        <Input
                          id="project"
                          value={projectName}
                          readOnly
                          className="h-10 bg-muted"
                        />
                        <Input
                          type="hidden"
                          value={projectId}
                          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                          readOnly={isReadOnly}
                        />
                        <p className="text-xs text-muted-foreground">Projet associé automatiquement</p>
                      </div>
                    ) : (
                      <>
                        {loadingProjects ? (
                          <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Chargement des projets...</span>
                          </div>
                        ) : projects.length > 0 ? (
                          <Select
                            value={formData.project}
                            onValueChange={(value) => setFormData({ ...formData, project: value })}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}>
                              <SelectValue placeholder="Sélectionner un projet" />
                            </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Aucun projet --</SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Input
                              id="project"
                              value={formData.project}
                              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                              placeholder="ID du projet associé"
                              readOnly={isReadOnly}
                              className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                            />
                            <p className="text-xs text-muted-foreground">Laissez vide si pas de projet associé</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period" className="font-medium">Période *</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData({ ...formData, period: value })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}>
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
              </div>
            </div>

            {/* Section Montant */}
            <div className="space-y-5">
             
              
              <div className="space-y-2">
                <Label htmlFor="total_amount" className="font-medium">Montant total demandé (GNF) *</Label>
                <div className="relative">
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount === "" ? "" : Number(formData.total_amount)}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData({ ...formData, total_amount: val === "" ? "" : Number(val) })
                    }}
                    required
                    placeholder="0.00"
                    readOnly={isReadOnly}
                    className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <Label htmlFor="description">Motif / Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Décrivez en détail le motif de cette demande d'opération..."
                rows={4}
                readOnly={isReadOnly}
                className={isReadOnly ? "bg-muted" : ""}
              />
            </div>

            {/* Section Devis */}
            {!isReadOnly && (
              <div className="space-y-3 pb-4">
                <div className="border-b pb-2">
                  <Label className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Devis / Document joint
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joignez un devis ou tout document justificatif (PDF, image, etc.)
                  </p>
                </div>
                <div className="space-y-2">
                  {quoteFile ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{quoteFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(quoteFile.size / 1024).toFixed(1)} Ko
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuoteFile(null)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Label
                        htmlFor="quote-upload"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Cliquez</span> pour sélectionner un fichier
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, PNG, JPG (max. 10 Mo)
                          </p>
                        </div>
                        <Input
                          id="quote-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setQuoteFile(file)
                          }}
                        />
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Afficher le devis existant en mode lecture seule */}
            {isReadOnly && initialData?.quote_url && (
              <div className="space-y-2 pb-4">
                <Label className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Devis joint
                </Label>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a
                    href={initialData.quote_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le devis
                  </a>
                </Button>
              </div>
            )}

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
              {isReadOnly ? "Fermer" : "Annuler"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? "Mise à jour..." : "Enregistrement..."}
                  </>
                ) : (
                  <>{initialData ? "Mettre à jour" : "Enregistrer"} la demande</>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}