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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
}

export function WarehouseFormDialog({ open, onOpenChange, onSubmit, initialData }: WarehouseFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      location: "",
      capacity: 0,
      occupied: 0,
      manager: "",
      categories: [],
    },
  )
  const [categoryInput, setCategoryInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  const addCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData({ ...formData, categories: [...formData.categories, categoryInput.trim()] })
      setCategoryInput("")
    }
  }

  const removeCategory = (category: string) => {
    setFormData({ ...formData, categories: formData.categories.filter((c: string) => c !== category) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update warehouse information" : "Add a new warehouse location"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Warehouse Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Full address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (units) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupied">Currently Occupied *</Label>
                <Input
                  id="occupied"
                  type="number"
                  value={formData.occupied}
                  onChange={(e) => setFormData({ ...formData, occupied: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Manager *</Label>
              <Input
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">Storage Categories</Label>
              <div className="flex gap-2">
                <Input
                  id="categories"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  placeholder="Add category and press Enter"
                />
                <Button type="button" onClick={addCategory}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categories.map((category: string) => (
                  <Badge key={category} variant="secondary" className="gap-1">
                    {category}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeCategory(category)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Add"} Warehouse</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
