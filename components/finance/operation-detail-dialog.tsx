"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Download,
  Eye,
} from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Subcategory {
  name?: string
  amount?: number
}

export interface Operation {
  id: string | number
  reference?: string
  status: "draft" | "submitted" | "validated" | "paid" | "rejected" | string
  created_at?: string
  updated_at?: string
  task_name?: string
  period?: string
  requester?: { name?: string } | null
  validated_by?: { name?: string } | null
  validation_date?: string | null
  rejection_reason?: string | null
  payment_proof_url?: string | null
  payment_proof?: boolean
  project?: { name?: string } | null
  project_name?: string | null
  category?: string | null
  categories?: string[] | null  // Nouveau champ pour plusieurs catégories
  total_amount: number
  description?: string | null
  subcategory?: string | Subcategory[] | null
  subcategories?: string | Subcategory[] | null
}

interface OperationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: Operation | null
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-500/10  text-gray-700  dark:text-gray-400",
  submitted: "bg-blue-500/10  text-blue-700  dark:text-blue-400",
  validated: "bg-green-500/10 text-green-700 dark:text-green-400",
  paid:      "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  rejected:  "bg-red-500/10   text-red-700   dark:text-red-400",
}

const PERIOD_LABELS: Record<string, string> = {
  daily:     "Quotidien",
  weekly:    "Hebdomadaire",
  monthly:   "Mensuel",
  quarterly: "Trimestriel",
  yearly:    "Annuel",
  one_time:  "Ponctuel",
}

const CATEGORY_LABELS: Record<string, string> = {
  materials:  "Matériaux",
  labor:      "Main d'œuvre",
  equipment:  "Équipement",
  transport:  "Transport",
  utilities:  "Services",
  consulting: "Consulting",
  software:   "Logiciels",
  other:      "Autre",
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getStatusIcon = (status: string) => {
  switch (status) {
    case "draft":     return <Clock       className="h-4 w-4" />
    case "submitted": return <Send        className="h-4 w-4" />
    case "validated": return <CheckCircle className="h-4 w-4" />
    case "paid":      return <DollarSign  className="h-4 w-4" />
    case "rejected":  return <XCircle     className="h-4 w-4" />
    default:          return <FileText    className="h-4 w-4" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "draft":     return "Brouillon"
    case "submitted": return "Soumis"
    case "validated": return "Validé"
    case "paid":      return "Payé"
    case "rejected":  return "Rejeté"
    default:          return status
  }
}

const formatCurrency = (amount: number) => {
  if (isNaN(amount) || !isFinite(amount)) return "0 GNF"
  return new Intl.NumberFormat("fr-FR", {
    style:                 "currency",
    currency:              "GNF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Non spécifiée"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

const parseSubcategories = (
  data: string | Subcategory[] | null | undefined
): Subcategory[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [{ name: data, amount: 0 }]
    }
  }
  return []
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function OperationDetailDialog({
  open,
  onOpenChange,
  operation,
}: OperationDetailDialogProps) {
  if (!operation) return null

  // Debug: Afficher les données reçues
  console.log("Données de l'opération reçues:", operation)
  console.log("Champ category:", operation.category)
  console.log("Champ categories:", operation.categories)
  console.log("Type de categories:", typeof operation.categories)

  // Gérer les catégories (simple ou multiples)
  const getCategoryLabels = () => {
    // 1. Si categories existe et est un tableau, utiliser cela
    if (operation.categories && Array.isArray(operation.categories) && operation.categories.length > 0) {
      console.log("Utilisation du champ categories (tableau):", operation.categories)
      return operation.categories.map(cat => 
        CATEGORY_LABELS[cat ?? ""] ?? cat ?? "Non spécifiée"
      )
    }
    
    // 2. Si categories est une chaîne JSON, la parser
    if (operation.categories && typeof operation.categories === 'string') {
      try {
        const parsed = JSON.parse(operation.categories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Utilisation du champ categories (JSON parsé):", parsed)
          return parsed.map(cat => 
            CATEGORY_LABELS[cat ?? ""] ?? cat ?? "Non spécifiée"
          )
        }
      } catch (e) {
        console.log("Impossible de parser categories comme JSON:", e)
      }
    }
    
    // 3. Si category est une chaîne avec des virgules, la séparer
    if (operation.category && typeof operation.category === 'string' && operation.category.includes(',')) {
      const categories = operation.category
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0)
      
      if (categories.length > 0) {
        console.log("Utilisation du champ category (séparé par virgules):", categories)
        return categories.map(cat => 
          CATEGORY_LABELS[cat ?? ""] ?? cat ?? "Non spécifiée"
        )
      }
    }
    
    // 4. Sinon, utiliser category (rétrocompatibilité)
    const singleCategory = CATEGORY_LABELS[operation.category ?? ""] ?? operation.category ?? "Non spécifiée"
    console.log("Utilisation du champ category (simple):", singleCategory)
    return [singleCategory]
  }
  
  const categoryLabels = getCategoryLabels()
  const hasMultipleCategories = categoryLabels.length > 1
  console.log("Labels de catégories:", categoryLabels)
  console.log("Multiple categories?", hasMultipleCategories)

  const subcategories = parseSubcategories(
    operation.subcategories ?? operation.subcategory
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Détails de l&apos;opération
          </DialogTitle>
          <DialogDescription>Référence : {operation.reference}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`flex items-center gap-1.5 px-3 py-1 ${STATUS_COLORS[operation.status] ?? ""}`}
              >
                {getStatusIcon(operation.status)}
                {getStatusLabel(operation.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Créée le {formatDate(operation.created_at)}
              </span>
            </div>

            {operation.payment_proof_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={operation.payment_proof_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Preuve
                </a>
              </Button>
            )}
          </div>

          <Separator />

          {/* General + Financial info */}
          <div className="grid grid-cols-1 gap-1 md:grid-cols-1">

            {/* Informations générales */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Informations générales
              </h3>
              <div className="flex justify-between">
                <span className="text-sm">Tâche</span>
                <span className="font-medium">{operation.task_name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Période</span>
                <span className="font-medium">
                  {PERIOD_LABELS[operation.period ?? ""] ?? operation.period ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Demandeur</span>
                <span className="font-medium">
                  {operation.requester?.name ?? "Non spécifié"}
                </span>
              </div>
            </div>

            {/* Informations financières */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Informations financières
              </h3>
              <div className="flex justify-between">
                <span className="text-sm">Montant total</span>
                <span className="text-lg font-medium">
                  {formatCurrency(operation.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Projet</span>
                <span className="font-medium">
                  {operation.project?.name ?? operation.project_name ?? "Non associé"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Catégorie{hasMultipleCategories ? 's' : ''}</span>
                <span className="font-medium text-right max-w-[60%]">
                  {hasMultipleCategories ? (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {categoryLabels.map((label, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    categoryLabels[0]
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Validation & Paiement */}
          {["validated", "paid", "rejected"].includes(operation.status) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Validation &amp; Paiement
                </h3>

                {operation.validated_by?.name && (
                  <div className="flex justify-between">
                    <span className="text-sm">Validé par</span>
                    <span className="font-medium">{operation.validated_by.name}</span>
                  </div>
                )}
                {operation.validation_date && (
                  <div className="flex justify-between">
                    <span className="text-sm">Date de validation</span>
                    <span className="font-medium">{formatDate(operation.validation_date)}</span>
                  </div>
                )}
                {operation.status === "paid" && operation.payment_proof && (
                  <div className="flex justify-between">
                    <span className="text-sm">Preuve de paiement</span>
                    <span className="font-medium">Disponible</span>
                  </div>
                )}
                {operation.status === "rejected" && operation.rejection_reason && (
                  <div className="flex justify-between">
                    <span className="text-sm">Raison du rejet</span>
                    <span className="font-medium text-destructive">
                      {operation.rejection_reason}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sous-catégories */}
          {(operation.subcategory || operation.subcategories) && (
            <>
              <Separator />
              <div className="rounded-md bg-muted/30 p-3 space-y-2">
                {subcategories.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    Aucune sous-catégorie avec montant spécifié
                  </p>
                ) : (
                  <>
                    {/* Résumé catégorie */}
                    <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          {hasMultipleCategories ? (
                            <div className="flex flex-wrap gap-1">
                              {categoryLabels.map((label, index) => (
                                <span key={index} className="inline-flex items-center">
                                  {label}
                                  {index < categoryLabels.length - 1 && <span className="mx-1">+</span>}
                                </span>
                              ))}
                            </div>
                          ) : (
                            categoryLabels[0]
                          )} :
                        </span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(operation.total_amount)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                        Ce montant correspond à la somme des sous-catégories ci-dessous
                      </p>
                    </div>

                    {/* Liste */}
                    <div className="divide-y">
                      {subcategories.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm">{item.name ?? "Sous-catégorie"}</span>
                          <span className="font-semibold text-sm">
                            {formatCurrency(item.amount ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Description */}
          {operation.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <div className="rounded-md bg-muted/30 p-3">
                  <p className="whitespace-pre-wrap text-sm">{operation.description}</p>
                </div>
              </div>
            </>
          )}

          {/* Métadonnées */}
          <Separator />
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div><span className="font-medium">ID :</span> {operation.id}</div>
            <div>
              <span className="font-medium">Dernière mise à jour :</span>{" "}
              {formatDate(operation.updated_at)}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}