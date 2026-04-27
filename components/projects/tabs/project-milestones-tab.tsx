"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Milestone } from "@/lib/project-types"

const statusColors = {
  "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  planning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "on-hold": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const milestoneIcons = {
  completed: CheckCircle2,
  "in-progress": Clock,
  pending: Circle,
}

interface ProjectMilestonesTabProps {
  milestones: Milestone[]
  onAdd: () => void
  onEdit: (milestone: Milestone) => void
  onDelete: (milestoneId: string) => void
}

export function ProjectMilestonesTab({ milestones, onAdd, onEdit, onDelete }: ProjectMilestonesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Milestones</CardTitle>
            <CardDescription>Key milestones and deliverables</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            New Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const Icon = milestoneIcons[milestone.status as keyof typeof milestoneIcons]
            return (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="relative">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      milestone.status === "completed" && "bg-green-500/10",
                      milestone.status === "in-progress" && "bg-blue-500/10",
                      milestone.status === "pending" && "bg-gray-500/10",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        milestone.status === "completed" && "text-green-600",
                        milestone.status === "in-progress" && "text-blue-600",
                        milestone.status === "pending" && "text-gray-600",
                      )}
                    />
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="absolute left-5 top-10 h-12 w-0.5 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[milestone.status]}>
                        {milestone.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(milestone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(milestone.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(milestone.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
