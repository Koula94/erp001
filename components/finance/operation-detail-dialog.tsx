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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Download,
  Eye,
  User,
  Calendar,
  Briefcase,
  RotateCcw,
  CreditCard,
  ClipboardList,
  Hash,
  AlertCircle,
  CheckIcon,
} from "lucide-react"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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
  quote_url?: string | null
  project?: { name?: string } | null
  project_name?: string | null
  total_amount: number
  description?: string | null
}

interface OperationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: Operation | null
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string; step: number }> = {
  draft: {
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-500/10 border-gray-200",
    icon: <Clock className="h-4 w-4" />,
    label: "Brouillon",
    step: 1,
  },
  submitted: {
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-200",
    icon: <Send className="h-4 w-4" />,
    label: "Soumis",
    step: 2,
  },
  validated: {
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-500/10 border-green-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Validé",
    step: 3,
  },
  paid: {
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-200",
    icon: <DollarSign className="h-4 w-4" />,
    label: "Payé",
    step: 4,
  },
  rejected: {
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-500/10 border-red-200",
    icon: <XCircle className="h-4 w-4" />,
    label: "Rejeté",
    step: 0,
  },
}

const PERIOD_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  yearly: "Annuel",
  one_time: "Ponctuel",
}

const WORKFLOW_STEPS = [
  { key: "draft", label: "Brouillon", icon: <Clock className="h-4 w-4" /> },
  { key: "submitted", label: "Soumis", icon: <Send className="h-4 w-4" /> },
  { key: "validated", label: "Validé", icon: <CheckCircle2 className="h-4 w-4" /> },
  { key: "paid", label: "Payé", icon: <DollarSign className="h-4 w-4" /> },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatCurrency = (amount: number) => {
  if (isNaN(amount) || !isFinite(amount)) return "0 GNF"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "GNF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Non spécifiée"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatDateShort = (dateString?: string | null) => {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ─────────────────────────────────────────────
// Workflow Timeline Component
// ─────────────────────────────────────────────

function WorkflowTimeline({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0
  const isRejected = status === "rejected"

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <RotateCcw className="h-4 w-4" />
        Progression du workflow
      </h3>
      <div className="relative">
        {/* Barre de progression */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isRejected ? "bg-red-500" : "bg-green-500"
            }`}
            style={{
              width: isRejected
                ? "100%"
                : currentStep === 1
                ? "0%"
                : currentStep === 2
                ? "33%"
                : currentStep === 3
                ? "66%"
                : currentStep === 4
                ? "100%"
                : "0%",
            }}
          />
        </div>

        {/* Étapes */}
        <div className="relative flex justify-between">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber <= currentStep && !isRejected
            const isCurrent = stepNumber === currentStep && !isRejected

            return (
              <div key={step.key} className="flex flex-col items-center gap-2">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                    isActive
                      ? isCurrent
                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30"
                        : "bg-green-500 border-green-500 text-white"
                      : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {isActive ? <CheckIcon className="h-5 w-5" /> : step.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {isRejected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">
            Cette demande a été rejetée
          </span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? "text-lg text-primary" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
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

  const statusConfig = STATUS_CONFIG[operation.status] ?? STATUS_CONFIG.draft

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Détails de l'opération</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Hash className="h-3 w-3" />
                Référence : {operation.reference}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Status & Date */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Créée le {formatDateShort(operation.created_at)}
              </span>
            </div>

            {operation.status === "paid" && operation.payment_proof_url && (
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a
                  href={operation.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  Télécharger le justificatif
                </a>
              </Button>
            )}
          </div>

          {/* Workflow Timeline */}
          <WorkflowTimeline status={operation.status} />

          <Separator />

          {/* Montant en évidence */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(operation.total_amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">Statut actuel</p>
                  <p className="text-lg font-medium">{statusConfig.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={<Briefcase className="h-4 w-4 text-blue-600" />}
                label="Tâche"
                value={operation.task_name ?? "—"}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4 text-blue-600" />}
                label="Période"
                value={
                  PERIOD_LABELS[operation.period ?? ""] ??
                  operation.period ??
                  "—"
                }
              />
              <InfoRow
                icon={<User className="h-4 w-4 text-blue-600" />}
                label="Demandeur"
                value={operation.requester?.name ?? "Non spécifié"}
              />
              <InfoRow
                icon={<Briefcase className="h-4 w-4 text-blue-600" />}
                label="Projet"
                value={
                  operation.project?.name ??
                  operation.project_name ??
                  "Non associé"
                }
              />
            </CardContent>
          </Card>

          {/* Devis joint */}
          {operation.quote_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Devis joint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a
                    href={operation.quote_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le devis
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Validation & Paiement */}
          {["validated", "paid", "rejected"].includes(operation.status) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Validation & Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {operation.validated_by?.name && (
                  <InfoRow
                    icon={<User className="h-4 w-4 text-green-600" />}
                    label="Validé par"
                    value={operation.validated_by.name}
                  />
                )}
                {operation.validation_date && (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4 text-green-600" />}
                    label="Date de validation"
                    value={formatDate(operation.validation_date)}
                  />
                )}
               
              
                {operation.status === "rejected" && operation.rejection_reason && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-200">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Raison du rejet</p>
                      <p className="text-sm font-medium text-red-700">
                        {operation.rejection_reason}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {operation.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/30 p-4 border">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {operation.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métadonnées */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              <span>
                <span className="font-medium">ID :</span> {operation.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3 w-3" />
              <span>
                <span className="font-medium">Dernière mise à jour :</span>{" "}
                {formatDateShort(operation.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
