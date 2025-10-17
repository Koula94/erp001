// Authentication context and utilities for SOFIXE ERP/CRM

export type UserRole = "admin" | "manager" | "employee" | "hr" | "stock" | "finance"

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  position?: string
  department?: string
  is_active: boolean
  date_joined: string
}

// Helper function to get full name
export function getUserFullName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.username
}

// Role-based permissions
export const permissions = {
  admin: ["all"],
  manager: ["dashboard", "crm", "projects", "reports"],
  employee: ["dashboard", "projects", "timesheet"],
  hr: ["dashboard", "hr", "employees", "payroll"],
  stock: ["dashboard", "stock", "inventory", "equipment"],
  finance: ["dashboard", "finance", "invoices", "expenses", "reports"],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const userPermissions = permissions[role]
  return userPermissions.includes("all") || userPermissions.includes(permission)
}

// Authentication response types
export interface AuthResponse {
  user: User
  access: string
  refresh: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  position?: string
  department?: string
}
