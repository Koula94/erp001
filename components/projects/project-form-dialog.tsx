"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { projectFormSchema, type ProjectFormInput } from "@/lib/validation"
import { useToast } from "@/hooks/use-toast"

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (project: any) => void
  project?: any
}

interface Client {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  position: string
}

export function ProjectFormDialog({ open, onOpenChange, onSubmit, project }: ProjectFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || "",
      client: project?.client?.toString() || "",
      description: project?.description || "",
      status: project?.status || "planning",
      start_date: project?.start_date || "",
      end_date: project?.end_date || "",
      budget: project?.budget?.toString() || "",
      manager: project?.manager?.toString() || "",
      team: project?.team?.map(t => t.toString()) || [],
    }
  })

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      reset({
        name: project.name || "",
        client: project.client?.toString() || "",
        description: project.description || "",
        status: project.status || "planning",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget?.toString() || "",
        manager: project.manager?.toString() || "",
        team: project.team?.map(t => t.toString()) || [],
      })
    } else {
      reset({
        name: "",
        client: "",
        description: "",
        status: "planning",
        start_date: "",
        end_date: "",
        budget: "",
        manager: "",
        team: [],
      })
    }
  }, [project, reset])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientsResponse, employeesResponse] = await Promise.all([
        api.clients.list(),
        api.employees.list()
      ])
      
      // Handle different response formats safely
      const clientsData = Array.isArray(clientsResponse) ? clientsResponse : 
                         (clientsResponse && typeof clientsResponse === 'object' && 'results' in clientsResponse ? 
                          (clientsResponse as any).results : [])
      
      const employeesData = Array.isArray(employeesResponse) ? employeesResponse : 
                           (employeesResponse && typeof employeesResponse === 'object' && 'results' in employeesResponse ? 
                            (employeesResponse as any).results : [])
      
      setClients(clientsData as Client[])
      setEmployees(employeesData as Employee[])
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (data: ProjectFormInput) => {
    try {
      await onSubmit({
        ...project,
        ...data,
        progress: project?.progress || 0,
        spent: project?.spent || 0,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to submit project:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          <DialogDescription>
            {project ? "Mettre à jour les informations du projet" : "Créer un nouveau projet pour votre client"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={hookFormSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nom du projet"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                onValueChange={(value) => setValue("client", value)}
                defaultValue={watch("client")}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Chargement des clients..." : "Sélectionner un client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client && (
                <p className="text-sm text-red-600">{errors.client.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Description du projet"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                onValueChange={(value) => setValue("status", value as any)}
                defaultValue={watch("status")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planification</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="on-hold">En attente</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Chef de projet *</Label>
              <Select
                onValueChange={(value) => setValue("manager", value)}
                defaultValue={watch("manager")}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Chargement des managers..." : "Sélectionner un manager"} />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((emp) => emp.position.toLowerCase().includes("manager"))
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.manager && (
                <p className="text-sm text-red-600">{errors.manager.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début *</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin *</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($) *</Label>
            <Input
              id="budget"
              type="number"
              {...register("budget")}
              placeholder="0.00"
            />
            {errors.budget && (
              <p className="text-sm text-red-600">{errors.budget.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : (project ? "Mettre à jour" : "Créer le projet")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
