"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Mail, Phone, Star, Pencil, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmployeeFormDialog } from "./employee-form-dialog"
import { api } from "@/lib/api"

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  "on-leave": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

interface Employee {
  id: number
  user: number
  employee_id: string
  hire_date: string
  salary: string
  status: string
  skills: string[]
  performance_rating: string | null
  user_details?: {
    id: number
    email: string
    first_name: string
    last_name: string
    position: string
    department: string
    phone: string
  }
  name: string
  email: string
  phone: string
  position: string
  department: string
}

interface EmployeesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Employee[]
}

export function EmployeesTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [employeesList, setEmployeesList] = useState<Employee[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.employees.list() as EmployeesResponse
      setEmployeesList(response.results || [])
    } catch (err: any) {
      setError(err.message || "Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employeesList.filter(
    (employee) =>
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddEmployee = async (employeeData: any) => {
    try {
      const newEmployee = await api.employees.create(employeeData) as Employee
      setEmployeesList([...employeesList, newEmployee])
    } catch (err: any) {
      setError(err.message || "Failed to add employee")
    }
  }

  const handleEditEmployee = async (employeeData: any) => {
    if (!editingEmployee?.id) return
    try {
      const updatedEmployee = await api.employees.update(editingEmployee.id.toString(), employeeData) as Employee
      setEmployeesList(employeesList.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp)))
      setEditingEmployee(null)
    } catch (err: any) {
      setError(err.message || "Failed to update employee")
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.employees.delete(id.toString())
        setEmployeesList(employeesList.filter((emp) => emp.id !== id))
      } catch (err: any) {
        setError(err.message || "Failed to delete employee")
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Manage employee information and records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[employee.status as keyof typeof statusColors]}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{employee.performance_rating || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(employee.hire_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{employee.name}</DialogTitle>
                            <DialogDescription>{employee.position}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Email:</span>
                                  <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">Phone:</span>
                                  <span>{employee.phone}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Department:</span> {employee.department}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Hire Date:</span>{" "}
                                  {new Date(employee.hire_date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Details</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Employee ID:</span>
                                      <span className="font-medium">{employee.id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Salary:</span>
                                      <span className="font-medium">${employee.salary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Status:</span>
                                      <Badge variant="outline" className={statusColors[employee.status as keyof typeof statusColors]}>
                                        {employee.status}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Performance:</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium">{employee.performance_rating}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {employee.skills.map((skill: string, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEmployee(employee)
                          setIsFormOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingEmployee(null)
        }}
        onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
        employee={editingEmployee}
      />
    </div>
  )
}
