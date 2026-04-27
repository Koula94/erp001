/**
 * Types partagés pour le module Projets
 * Centralise les interfaces utilisées par ProjectDetails et ses sous-composants
 */

export interface Project {
  id: string
  name: string
  client_name: string
  status: "in-progress" | "planning" | "on-hold" | "completed"
  progress: number
  start_date: string
  end_date: string
  budget: number
  spent: number
  manager_name: string
  team_members: Array<{ name: string }>
  description: string
}

export interface Task {
  id: string
  project: string
  title: string
  status: "pending" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  assignee: string
  start_date: string
  end_date: string
  progress: number
  description: string
}

export interface Milestone {
  id: string
  project: string
  title: string
  date: string
  status: "pending" | "in-progress" | "completed"
  description: string
}

export interface Expense {
  id: string
  description: string
  category: string
  subcategory?: string
  subcategories?: Array<{ name: string; amount: number }>
  amount: number
  date: string
  project: { id: string; name: string }
  status: string
  priority: string
  fund_source?: string
  submitted_by?: { id: string; name: string }
  approved_by?: { id: string; name: string }
  paid_by?: { id: string; name: string }
  payment_date?: string
  notes?: string
  receipt?: string
  receipt_url?: string
  created_at: string
  updated_at: string
}

export interface OperationRequest {
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

export interface OperationStats {
  total_demande: number
  total_valide: number
  total_paye: number
  reste_a_payer: number
  total_count: number
  valide_count: number
  paye_count: number
  en_attente_count: number
}

export interface ExpenseStats {
  total_depense: number
  total_budget_projet: number
  total_caisse_operations: number
  total_fonds_urgence: number
  total_global: number
  total_count: number
}
