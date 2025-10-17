"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { type UserRole, permissions } from "@/lib/auth"

const allPermissions = [
  { id: "dashboard", label: "Dashboard", description: "View dashboard and analytics" },
  { id: "crm", label: "CRM", description: "Manage clients and quotes" },
  { id: "projects", label: "Projects", description: "Manage projects and tasks" },
  { id: "hr", label: "HR", description: "Manage employees and payroll" },
  { id: "stock", label: "Stock", description: "Manage inventory and equipment" },
  { id: "finance", label: "Finance", description: "Manage invoices and expenses" },
  { id: "reports", label: "Reports", description: "View and generate reports" },
  { id: "employees", label: "Employees", description: "View employee directory" },
  { id: "payroll", label: "Payroll", description: "Process payroll" },
  { id: "inventory", label: "Inventory", description: "Manage inventory" },
  { id: "equipment", label: "Equipment", description: "Manage equipment" },
  { id: "invoices", label: "Invoices", description: "Create and manage invoices" },
  { id: "expenses", label: "Expenses", description: "Track expenses" },
  { id: "timesheet", label: "Timesheet", description: "Submit timesheets" },
]

const roleDescriptions = {
  admin: "Full system access with all permissions",
  manager: "Manage projects, CRM, and view reports",
  employee: "Basic access to dashboard and assigned projects",
  hr: "Manage employees, payroll, and HR functions",
  stock: "Manage inventory, equipment, and stock",
  finance: "Manage finances, invoices, and expenses",
}

export function RolesTab() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin")

  const rolePermissions = permissions[selectedRole]
  const hasAllPermissions = rolePermissions.includes("all")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Select a role to view its permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(permissions) as UserRole[]).map((role) => (
              <div
                key={role}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selectedRole === role ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{role}</span>
                  <Badge variant="outline" className="capitalize">
                    {role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{roleDescriptions[role]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions for {selectedRole}</CardTitle>
          <CardDescription>
            {hasAllPermissions
              ? "This role has access to all system features"
              : "Specific permissions assigned to this role"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allPermissions.map((permission) => {
              const hasPermission = hasAllPermissions || rolePermissions.includes(permission.id)

              return (
                <div key={permission.id} className="flex items-start space-x-3">
                  <Checkbox id={permission.id} checked={hasPermission} disabled className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
