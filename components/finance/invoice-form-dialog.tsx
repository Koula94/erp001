"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { Plus, X } from "lucide-react"
import { api } from "@/lib/api"

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Project {
  id: string
  name: string
  client_name?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
}

interface InvoiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
}

export function InvoiceFormDialog({ open, onOpenChange, onSubmit, initialData }: InvoiceFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      clientId: "",
      clientName: "",
      projectId: "",
      projectName: "",
      status: "draft",
      dueDate: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
      amount: 0, // ensure amount exists to avoid undefined/NaN
      notes: "",
    },
  )

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      // normalize numeric fields from initialData to avoid NaN issues
      const items = (initialData.items || []).map((it: any) => ({
        ...it,
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
      }))
      setFormData({
        ...initialData,
        amount: Number(initialData.amount) || items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0),
        items,
      })
    } else {
      // Reset form when creating new invoice
      setFormData({
        clientId: "",
        clientName: "",
        projectId: "",
        projectName: "",
        status: "draft",
        dueDate: "",
        items: [{ description: "", quantity: 1, unit_price: 0 }],
        amount: 0,
        notes: "",
      })
    }
  }, [initialData, open])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadClients()
      loadProjects()
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

  const loadProjects = async () => {
    try {
      const response = await api.projects.list() as any
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setProjects(data as Project[])
    } catch (err) {
      console.error("Error loading projects:", err)
    }
  }

  // Compute total amount from items whenever items change
  useEffect(() => {
    const items = formData.items || []
    const total = items.reduce((sum: number, it: any) => {
      const qty = Number(it.quantity) || 0
      const price = Number(it.unit_price) || 0
      return sum + qty * price
    }, 0)
    // Only update amount if different to avoid unnecessary renders
    if (formData.amount !== total) {
      setFormData((prev: any) => ({ ...prev, amount: total }))
    }
  }, [formData.items])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Recalculate amount from items to be sure
      const items = formData.items || []
      const amount = items.reduce((sum: number, it: any) => {
        const qty = Number(it.quantity) || 0
        const price = Number(it.unit_price)
        return sum + qty * (isNaN(price) ? 0 : price)
      }, 0)

      // Validation: amount must be a valid number > 0
      if (isNaN(amount) || amount <= 0) {
        setError("Le montant est requis et doit être un nombre valide")
        return
      }

      // Validation: every item must have a numeric unit_price
      if (!items.length || items.some((item: any) => item.unit_price === "" || item.unit_price === null || item.unit_price === undefined || isNaN(Number(item.unit_price)))) {
        setError("Le prix unitaire est requis pour tous les articles")
        return
      }

      // Get the selected client and project names
      const selectedClient = clients.find(client => client.id === formData.clientId)
      const selectedProject = projects.find(project => project.id === formData.projectId)
      const invoiceData = {
        ...formData,
        amount,
        clientName: selectedClient?.name || formData.clientName,
        projectName: selectedProject?.name || formData.projectName,
        items: items.map((it: any) => ({ ...it, quantity: Number(it.quantity) || 0, unit_price: Number(it.unit_price) || 0 })),
      }

      onSubmit(invoiceData)
      onOpenChange(false)
    },
    [formData, onSubmit, clients, projects, onOpenChange]
  )

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unit_price: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_: any, i: number) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    // coerce numeric fields to numbers to avoid string/NaN issues
    const normalizedValue =
      field === "quantity" || field === "unit_price" ? (value === "" ? 0 : Number(value)) : value
    newItems[index] = { ...newItems[index], [field]: normalizedValue }
    setFormData({ ...formData, items: newItems, amount: undefined }) // amount will be recalculated by effect
    setError("") // clear previous error when user edits items
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update invoice information" : "Create a new invoice for a client"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading clients..." : "Select a client"} />
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
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (calculé)</Label>
                <Input
                  id="amount"
                  type="text"
                  value={typeof formData.amount === "number" ? formData.amount.toFixed(2) : "0.00"}
                  readOnly
                />
                <p className="text-sm text-muted-foreground">Le montant est calculé à partir des lignes (quantité × prix unitaire). Modifiez les lignes pour changer le montant.</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Invoice Items *</Label>
                <Button type="button" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity || 1}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        required
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        value={item.unit_price || 0}
                        onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                        required
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or payment terms"
                rows={3}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Create"} Invoice</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
