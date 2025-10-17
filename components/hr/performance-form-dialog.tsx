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

interface PerformanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (review: any) => void
  employees: any[]
}

export function PerformanceFormDialog({ open, onOpenChange, onSubmit, employees }: PerformanceFormDialogProps) {
  const [formData, setFormData] = useState({
    employee: "",
    review_date: new Date().toISOString().split('T')[0],
    reviewer: "",
    rating: "4.0",
    strengths: "",
    improvements: "",
    goals: "",
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        employee: "",
        review_date: new Date().toISOString().split('T')[0],
        reviewer: "",
        rating: "4.0",
        strengths: "",
        improvements: "",
        goals: "",
      })
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      employee: Number.parseInt(formData.employee),
      review_date: formData.review_date,
      reviewer: Number.parseInt(formData.reviewer),
      rating: formData.rating,
      strengths: formData.strengths,
      improvements: formData.improvements,
      goals: formData.goals,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Performance Review</DialogTitle>
          <DialogDescription>Create a performance evaluation for an employee</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={formData.employee}
                  onValueChange={(value) => setFormData({ ...formData, employee: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
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
              <div className="space-y-2">
                <Label htmlFor="reviewer">Reviewer Name *</Label>
                <Input
                  id="reviewer"
                  value={formData.reviewer}
                  onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Overall Rating (1-5) *</Label>
              <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5.0">5.0 - Outstanding</SelectItem>
                  <SelectItem value="4.5">4.5 - Excellent</SelectItem>
                  <SelectItem value="4.0">4.0 - Very Good</SelectItem>
                  <SelectItem value="3.5">3.5 - Good</SelectItem>
                  <SelectItem value="3.0">3.0 - Satisfactory</SelectItem>
                  <SelectItem value="2.5">2.5 - Needs Improvement</SelectItem>
                  <SelectItem value="2.0">2.0 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths *</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="Describe the employee's key strengths and achievements"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvements">Areas for Improvement *</Label>
              <Textarea
                id="improvements"
                value={formData.improvements}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="Identify areas where the employee can improve"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Goals for Next Period *</Label>
              <Textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="Set goals and objectives for the upcoming period"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Review</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
