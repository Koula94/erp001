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

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  materials?: any[]
}

export function TransactionFormDialog({ open, onOpenChange, onSubmit, materials = [] }: TransactionFormDialogProps) {
  const [formData, setFormData] = useState({
    type: "in",
    materialName: "",
    quantity: 0,
    reference: "",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.materialName || formData.materialName === "no-materials") {
      newErrors.materialName = "Please select a material"
    }
    if (!formData.reference.trim()) newErrors.reference = "Reference is required"

    // Numeric validation
    if (formData.quantity <= 0) newErrors.quantity = "Quantity must be greater than 0"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      onOpenChange(false)
      setFormData({
        type: "in",
        materialName: "",
        quantity: 0,
        reference: "",
        notes: "",
      })
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Stock Transaction</DialogTitle>
          <DialogDescription>Record a new inventory movement</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (Receiving)</SelectItem>
                  <SelectItem value="out">Stock Out (Allocation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialName">Material *</Label>
              <Select
                value={formData.materialName}
                onValueChange={(value) => handleInputChange("materialName", value)}
              >
                <SelectTrigger className={errors.materialName ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.length === 0 ? (
                    <SelectItem value="no-materials" disabled>No materials available</SelectItem>
                  ) : (
                    materials.map((material) => (
                      <SelectItem key={material.id} value={material.name}>
                        {material.name} ({material.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.materialName && <p className="text-sm text-red-500">{errors.materialName}</p>}
            </div>

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
              <Label htmlFor="reference">Reference *</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                placeholder="e.g., PO-2024-001, Project-Villa-A"
                className={errors.reference ? "border-red-500" : ""}
                required
              />
              {errors.reference && <p className="text-sm text-red-500">{errors.reference}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional transaction details"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
