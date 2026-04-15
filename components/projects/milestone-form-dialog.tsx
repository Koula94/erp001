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

interface MilestoneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (milestone: any) => void
  milestone?: any
  projectId: string
}

export function MilestoneFormDialog({ open, onOpenChange, onSubmit, milestone, projectId }: MilestoneFormDialogProps) {
  const [formData, setFormData] = useState({
    title: milestone?.title || "",
    description: milestone?.description || "",
    date: milestone?.date || "",
    status: milestone?.status || "pending",
  })

  // Reset form when milestone changes
  useEffect(() => {
    if (milestone) {
      setFormData({
        title: milestone.title || "",
        description: milestone.description || "",
        date: milestone.date || "",
        status: milestone.status || "pending",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        date: "",
        status: "pending",
      })
    }
  }, [milestone])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...milestone,
      ...formData,
      project: projectId,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit Milestone" : "New Milestone"}</DialogTitle>
          <DialogDescription>
            {milestone ? "Update milestone information" : "Create a new milestone for this project"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Milestone Title *</Label>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Target Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{milestone ? "Update Milestone" : "Create Milestone"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
