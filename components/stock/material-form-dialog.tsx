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

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
}

export function MaterialFormDialog({ open, onOpenChange, onSubmit, initialData }: MaterialFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      minStock: 0,
      maxStock: 0,
      unitPrice: 0,
      location: "",
      supplier: "",
      lastRestocked: new Date().toISOString().split('T')[0],
      status: "in-stock",
    },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = "Material name is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.unit.trim()) newErrors.unit = "Unit is required"
    if (!formData.location.trim()) newErrors.location = "Location is required"
    if (!formData.supplier.trim()) newErrors.supplier = "Supplier is required"

    // Numeric validation
    if (formData.quantity < 0) newErrors.quantity = "Quantity cannot be negative"
    if (formData.minStock < 0) newErrors.minStock = "Minimum stock cannot be negative"
    if (formData.maxStock < 0) newErrors.maxStock = "Maximum stock cannot be negative"
    if (formData.unitPrice < 0) newErrors.unitPrice = "Unit price cannot be negative"

    // Logical validation
    if (formData.maxStock > 0 && formData.minStock > formData.maxStock) {
      newErrors.minStock = "Minimum stock cannot exceed maximum stock"
    }

    // Date validation
    const today = new Date()
    const restockedDate = new Date(formData.lastRestocked)
    if (restockedDate > today) {
      newErrors.lastRestocked = "Restock date cannot be in the future"
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
          <DialogTitle>{initialData ? "Edit Material" : "Add New Material"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update material information" : "Add a new material to inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Material Name *</Label>
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
                    <SelectItem value="Building Materials">Building Materials</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
                  className={errors.quantity ? "border-red-500" : ""}
                  required
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  placeholder="e.g., kg, m, pcs"
                  className={errors.unit ? "border-red-500" : ""}
                  required
                />
                {errors.unit && <p className="text-sm text-red-500">{errors.unit}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange("unitPrice", Number(e.target.value))}
                  className={errors.unitPrice ? "border-red-500" : ""}
                  required
                />
                {errors.unitPrice && <p className="text-sm text-red-500">{errors.unitPrice}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock Level *</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange("minStock", Number(e.target.value))}
                  className={errors.minStock ? "border-red-500" : ""}
                  required
                />
                {errors.minStock && <p className="text-sm text-red-500">{errors.minStock}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Maximum Stock Level *</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => handleInputChange("maxStock", Number(e.target.value))}
                  className={errors.maxStock ? "border-red-500" : ""}
                  required
                />
                {errors.maxStock && <p className="text-sm text-red-500">{errors.maxStock}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Warehouse location"
                  className={errors.location ? "border-red-500" : ""}
                  required
                />
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                  placeholder="Supplier name"
                  className={errors.supplier ? "border-red-500" : ""}
                  required
                />
                {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastRestocked">Last Restocked Date *</Label>
              <Input
                id="lastRestocked"
                type="date"
                value={formData.lastRestocked}
                onChange={(e) => handleInputChange("lastRestocked", e.target.value)}
                className={errors.lastRestocked ? "border-red-500" : ""}
                required
              />
              {errors.lastRestocked && <p className="text-sm text-red-500">{errors.lastRestocked}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Add"} Material</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
