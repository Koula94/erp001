"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Project } from "@/lib/project-types"

interface ProjectBudgetTabProps {
  project: Project
}

export function ProjectBudgetTab({ project }: ProjectBudgetTabProps) {
  const budgetUsed = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Financial tracking for this project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">GNF{project.budget.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">GNF{project.spent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">GNF{(project.budget - project.spent).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Budget Utilization</span>
            <span className="text-sm font-medium">{budgetUsed.toFixed(1)}%</span>
          </div>
          <Progress value={budgetUsed} className="h-3" />
        </div>
      </CardContent>
    </Card>
  )
}
