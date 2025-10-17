"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Star } from "lucide-react"
import { PerformanceFormDialog } from "./performance-form-dialog"
import { api } from "@/lib/api"

interface PerformanceReview {
  id: number
  employee: number
  employee_name: string
  review_date: string
  reviewer: number
  reviewer_name: string
  rating: string
  strengths: string
  improvements: string
  goals: string
}

interface PerformanceReviewsResponse {
  count: number
  next: string | null
  previous: string | null
  results: PerformanceReview[]
}

export function PerformanceTab() {
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPerformanceReviews()
    loadEmployees()
  }, [])

  const loadPerformanceReviews = async () => {
    try {
      setLoading(true)
      const response = await api.performanceReviews.list() as PerformanceReviewsResponse
      setPerformanceReviews(response.results || [])
    } catch (err: any) {
      setError(err.message || "Failed to load performance reviews")
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await api.employees.list() as { results: any[] }
      setEmployees(response.results || [])
    } catch (err: any) {
      console.error("Failed to load employees:", err)
    }
  }

  const handleAddReview = async (reviewData: any) => {
    try {
      const newReview = await api.performanceReviews.create(reviewData) as PerformanceReview
      setPerformanceReviews([newReview, ...performanceReviews])
    } catch (err: any) {
      setError(err.message || "Failed to add performance review")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Review
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
          <CardDescription>Employee performance evaluations and feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performanceReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{review.employee_name}</CardTitle>
                      <CardDescription>
                        Reviewed by {review.reviewer_name} on {new Date(review.review_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">{review.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Strengths
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">{review.strengths}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                        Areas for Improvement
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">{review.improvements}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        Goals
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">{review.goals}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <PerformanceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddReview}
        employees={employees}
      />
    </div>
  )
}
