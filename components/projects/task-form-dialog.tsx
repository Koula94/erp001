"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (task: any) => void
  task?: any
  projectId: string
}

interface Employee {
  id: string
  user: number
  name: string
  position: string
}

export function TaskFormDialog({ open, onOpenChange, onSubmit, task, projectId }: TaskFormDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)

  // Helper: find the employee id (emp.id) that corresponds to a user id (task.assignee)
  const resolveAssigneeEmployeeId = (userIdOrEmployeeId: any, empList: Employee[]): string => {
    if (!userIdOrEmployeeId) return ""
    const numericId = Number(userIdOrEmployeeId)
    // First try: match by employee's user field (task.assignee is a user ID)
    const byUser = empList.find(emp => Number(emp.user) === numericId)
    if (byUser) return byUser.id
    // Fallback: match by employee id itself (already an employee ID)
    const byEmpId = empList.find(emp => emp.id === String(userIdOrEmployeeId))
    if (byEmpId) return byEmpId.id
    return ""
  }

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "pending",
    priority: task?.priority || "medium",
    assignee: "",
    start_date: task?.start_date || "",
    end_date: task?.end_date || "",
    progress: task?.progress || 0,
  })

  // Reset form when task or employees list changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "pending",
        priority: task.priority || "medium",
        assignee: resolveAssigneeEmployeeId(task.assignee, employees),
        start_date: task.start_date || "",
        end_date: task.end_date || "",
        progress: task.progress || 0,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignee: "",
        start_date: "",
        end_date: "",
        progress: 0,
      })
    }
  }, [task, employees])

  useEffect(() => {
    if (open) {
      loadEmployees()
    }
  }, [open])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const employeesResponse = await api.employees.list()
      
      // Handle different response formats safely
      const employeesData = Array.isArray(employeesResponse) ? employeesResponse : 
                           (employeesResponse && typeof employeesResponse === 'object' && 'results' in employeesResponse ? 
                            (employeesResponse as any).results : [])
      
      setEmployees(employeesData as Employee[])
    } catch (error) {
      console.error("Failed to load employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Find the selected employee to get the user ID
    const selectedEmployee = employees.find(emp => emp.id === formData.assignee)
    
    // Pass data to parent handler — the parent is responsible for closing the dialog
    // after the async API call completes (and after reloading the project progress)
    onSubmit({
      ...task,
      ...formData,
      project: Number(projectId),
      assignee: selectedEmployee ? Number(selectedEmployee.user) : null,
      progress: Number(formData.progress),
      start_date: formData.start_date,
      end_date: formData.end_date,
    })
    // NOTE: do NOT call onOpenChange(false) here — the parent (handleSubmitTask)
    // already calls setTaskDialogOpen(false) once the task is saved AND the
    // project progress has been reloaded from the backend.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update task information" : "Create a new task for this project"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee *</Label>
            <Select 
              value={formData.assignee} 
              onValueChange={(value) => setFormData({ ...formData, assignee: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading employees..." : "Select assignee"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Update Task" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
