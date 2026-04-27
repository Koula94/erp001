/**
 * Utilitaires partagés pour le module Dépenses
 */

export const categoryLabels: Record<string, string> = {
  materials: "Matériaux",
  labor: "Main d'œuvre",
  equipment: "Équipement",
  transport: "Transport",
  utilities: "Services",
  consulting: "Consulting",
  software: "Logiciels",
  other: "Autre",
}

export const priorityLabels: Record<string, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
}

export const priorityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR")} GNF`
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("fr-FR")
}
