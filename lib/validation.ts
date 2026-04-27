import { z } from "zod"

// Schéma de validation pour les projets (version formulaire)
export const projectFormSchema = z.object({
  name: z.string()
    .min(1, "Le nom du projet est requis")
    .max(200, "Le nom du projet ne peut pas dépasser 200 caractères"),
  client: z.string()
    .min(1, "Le client est requis"),
  description: z.string()
    .min(1, "La description est requise")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),

  status: z.enum(["planning", "in-progress", "on-hold", "completed"], {
    errorMap: () => ({ message: "Statut invalide" })
  }),
  start_date: z.string()
    .min(1, "La date de début est requise")
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, "La date de début ne peut pas être dans le passé"),
  end_date: z.string()
    .min(1, "La date de fin est requise"),
  budget: z.string()
    .min(1, "Le budget est requis")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Le budget doit être un nombre positif"),
  manager: z.string()
    .min(1, "Le manager est requis"),
  team: z.array(z.string())
    .optional()
    .default([]),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate >= startDate
}, {
  message: "La date de fin doit être après la date de début",
  path: ["end_date"]
})

// Schéma de validation pour l'API (avec conversion des types)
export const projectSchema = projectFormSchema.transform((data) => ({
  ...data,
  client: Number(data.client),
  budget: Number(data.budget),
  manager: Number(data.manager),
  team: data.team.map(t => Number(t)),
}))

// Schéma de validation pour les tâches
export const taskSchema = z.object({
  title: z.string()
    .min(1, "Le titre de la tâche est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z.string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),
  status: z.enum(["pending", "in-progress", "completed"], {
    errorMap: () => ({ message: "Statut invalide" })
  }),
  priority: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Priorité invalide" })
  }),
  assignee: z.string()
    .min(1, "L'assigné est requis")
    .transform(val => Number(val)),
  start_date: z.string()
    .min(1, "La date de début est requise"),
  end_date: z.string()
    .min(1, "La date de fin est requise"),
  progress: z.number()
    .min(0, "La progression ne peut pas être négative")
    .max(100, "La progression ne peut pas dépasser 100%"),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate >= startDate
}, {
  message: "La date de fin doit être après la date de début",
  path: ["end_date"]
})

// Schéma de validation pour les jalons
export const milestoneSchema = z.object({
  title: z.string()
    .min(1, "Le titre du jalon est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z.string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),
  date: z.string()
    .min(1, "La date cible est requise")
    .refine((date) => {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }, "La date cible ne peut pas être dans le passé"),
  status: z.enum(["pending", "in-progress", "completed"], {
    errorMap: () => ({ message: "Statut invalide" })
  }),
})

// Types TypeScript dérivés des schémas
export type ProjectFormInput = z.infer<typeof projectFormSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type MilestoneFormData = z.infer<typeof milestoneSchema>

// Fonctions utilitaires pour la validation
export const validateProject = (data: unknown) => projectSchema.safeParse(data)
export const validateTask = (data: unknown) => taskSchema.safeParse(data)
export const validateMilestone = (data: unknown) => milestoneSchema.safeParse(data)

// Fonctions pour obtenir les messages d'erreur
export const getValidationErrors = (error: z.ZodError) => {
  const errors: Record<string, string> = {}
  error.errors.forEach((err) => {
    if (err.path[0]) {
      errors[err.path[0] as string] = err.message
    }
  })
  return errors
}
