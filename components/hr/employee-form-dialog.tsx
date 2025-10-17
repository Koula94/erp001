"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { User } from "@/lib/auth"
import { getUserFullName } from "@/lib/auth"

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (employee: any) => void
  employee?: any
}

export function EmployeeFormDialog({ open, onOpenChange, onSubmit, employee }: EmployeeFormDialogProps) {
  const [formData, setFormData] = useState({
    user: "",
    employee_id: "",
    hire_date: "",
    salary: "",
    status: "active",
    skills: "",
  })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData({
        user: employee.user?.toString() || "",
        employee_id: employee.employee_id || "",
        hire_date: employee.hire_date || "",
        salary: employee.salary || "",
        status: employee.status || "active",
        skills: employee.skills?.join(", ") || "",
      })
    } else {
      setFormData({
        user: "",
        employee_id: "",
        hire_date: "",
        salary: "",
        status: "active",
        skills: "",
      })
    }
  }, [employee, open])

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      console.log("Fetching users from API...")
      const response = await api.users.list()
      console.log("Raw API Response:", response)
      console.log("Response type:", typeof response)
      console.log("Is array?", Array.isArray(response))
      
      // Handle different response formats
      let usersArray: User[] = []
      
      if (Array.isArray(response)) {
        usersArray = response
      } else if (response && typeof response === 'object') {
        // Check if response has a results property (common in DRF pagination)
        const responseObj = response as any
        if (Array.isArray(responseObj.results)) {
          usersArray = responseObj.results
        } else if (Array.isArray(responseObj.data)) {
          usersArray = responseObj.data
        } else {
          // Try to convert object values to array
          usersArray = Object.values(responseObj)
        }
      }
      
      console.log("Final users array:", usersArray)
      console.log("Number of users:", usersArray.length)
      
      setUsers(usersArray)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      console.error("Error details:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      user: Number.parseInt(formData.user),
      employee_id: formData.employee_id,
      hire_date: formData.hire_date,
      salary: formData.salary,
      status: formData.status,
      skills: formData.skills.split(",").map((s: string) => s.trim()),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee information" : "Enter employee details to add to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">User *</Label>
                <Select 
                  value={formData.user} 
                  onValueChange={(value) => setFormData({ ...formData, user: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        {loading ? "Loading users..." : "No users available"}
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getUserFullName(user)} ({user.username})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="e.g., EMP001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date *</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary *</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., 50000.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g., Project Management, AutoCAD, Leadership"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{employee ? "Update" : "Add"} Employee</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
