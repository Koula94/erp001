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

interface PayrollFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payroll: any) => void
  employeeCount: number
}

export function PayrollFormDialog({ open, onOpenChange, onSubmit, employeeCount }: PayrollFormDialogProps) {
  const [formData, setFormData] = useState({
    month: "",
    total_payroll: "",
    status: "pending",
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        month: "",
        total_payroll: "",
        status: "pending",
      })
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      month: formData.month,
      total_payroll: formData.total_payroll,
      employee_count: employeeCount,
      status: formData.status,
      processed_date: formData.status === "processed" ? new Date().toISOString().split('T')[0] : null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payroll</DialogTitle>
          <DialogDescription>Enter payroll details for the selected period</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="month">Period (Month/Year) *</Label>
              <Input
                id="month"
                placeholder="e.g., January 2025"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_payroll">Total Payroll Amount *</Label>
              <Input
                id="total_payroll"
                type="number"
                step="0.01"
                value={formData.total_payroll}
                onChange={(e) => setFormData({ ...formData, total_payroll: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Employees:</span> {employeeCount}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Process Payroll</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
