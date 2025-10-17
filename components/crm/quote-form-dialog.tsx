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
import { Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: "active" | "prospect" | "inactive"
  contact_person: string
  total_projects: number
  total_revenue: string
  created_at: string
  updated_at: string
}

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuoteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (quote: any) => void
}

export function QuoteFormDialog({ open, onOpenChange, onSave }: QuoteFormDialogProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    projectName: "",
    validUntil: "",
  })
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<QuoteItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0 }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await api.clients.list() as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setClients(data as Client[])
    } catch (err) {
      console.error("Error loading clients:", err)
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const quote = {
      clientId: formData.clientId,
      projectName: formData.projectName,
      amount: totalAmount,
      status: "pending",
      validUntil: formData.validUntil,
      items: items,
    }
    onSave(quote)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>Fill in the quote details and add line items</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until *</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Quote Items</Label>
                <Button type="button" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-5 space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Total</Label>
                      <Input value={`$${item.total.toLocaleString()}`} disabled />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end items-center gap-2 p-4 bg-muted rounded-lg">
                <span className="font-medium">Total Amount:</span>
                <span className="text-2xl font-bold">${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Quote</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
