"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, DollarSign, Users } from "lucide-react"
import { Project } from "@/lib/project-types"

const statusColors = {
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  planning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "on-hold": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const budgetUsed = project.budget > 0 ? (project.spent / project.budget) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{project.name}</CardTitle>
            <CardDescription className="mt-2">{project.description}</CardDescription>
          </div>
          <Badge variant="outline" className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
              <p className="text-muted-foreground">to {new Date(project.end_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Budget</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">GNF{project.budget.toLocaleString()}</p>
              <p className="text-muted-foreground">GNF{project.spent.toLocaleString()} dépensé</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">{project.manager_name}</p>
              <p className="text-muted-foreground">{project.team_members.length} team members</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Progress</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-2xl">{project.progress}%</p>
              <Progress value={project.progress} className="h-2 mt-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
