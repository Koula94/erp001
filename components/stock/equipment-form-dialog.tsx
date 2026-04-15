"use client"

import type React from "react"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface EquipmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
  projects?: any[]
}

export function EquipmentFormDialog({ open, onOpenChange, onSubmit, initialData, projects = [] }: EquipmentFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      category: "",
      status: "available",
      condition: "good",
      location: "",
      value: 0,
      assignedProject: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      lastMaintenance: new Date().toISOString().split("T")[0],
      nextMaintenance: "",
      notes: "",
    },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = "Equipment name is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.location.trim()) newErrors.location = "Location is required"

    // Numeric validation
    if (formData.value < 0) newErrors.value = "Value cannot be negative"

    // Date validation
    const today = new Date()
    const purchaseDate = new Date(formData.purchaseDate)
    const lastMaintenanceDate = new Date(formData.lastMaintenance)
    const nextMaintenanceDate = formData.nextMaintenance ? new Date(formData.nextMaintenance) : null

    if (purchaseDate > today) {
      newErrors.purchaseDate = "Purchase date cannot be in the future"
    }
    if (lastMaintenanceDate > today) {
      newErrors.lastMaintenance = "Last maintenance date cannot be in the future"
    }
    if (nextMaintenanceDate && nextMaintenanceDate < today) {
      newErrors.nextMaintenance = "Next maintenance date cannot be in the past"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      onOpenChange(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update equipment information" : "Add new equipment to inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  required
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Heavy Machinery">Heavy Machinery</SelectItem>
                    <SelectItem value="Power Tools">Power Tools</SelectItem>
                    <SelectItem value="Vehicles">Vehicles</SelectItem>
                    <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={errors.location ? "border-red-500" : ""}
                  required
                />
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value ($) *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", Number(e.target.value))}
                  className={errors.value ? "border-red-500" : ""}
                  required
                />
                {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedProject">Assigned Project</Label>
              <Select
                value={formData.assignedProject}
                onValueChange={(value) => setFormData({ ...formData, assignedProject: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-assigned">Not assigned</SelectItem>
                  {projects.length === 0 ? (
                    <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name} ({project.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                  className={errors.purchaseDate ? "border-red-500" : ""}
                  required
                />
                {errors.purchaseDate && <p className="text-sm text-red-500">{errors.purchaseDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Last Maintenance *</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={(e) => handleInputChange("lastMaintenance", e.target.value)}
                  className={errors.lastMaintenance ? "border-red-500" : ""}
                  required
                />
                {errors.lastMaintenance && <p className="text-sm text-red-500">{errors.lastMaintenance}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextMaintenance">Next Maintenance *</Label>
              <Input
                id="nextMaintenance"
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => handleInputChange("nextMaintenance", e.target.value)}
                className={errors.nextMaintenance ? "border-red-500" : ""}
                required
              />
              {errors.nextMaintenance && <p className="text-sm text-red-500">{errors.nextMaintenance}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this equipment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Add"} Equipment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
