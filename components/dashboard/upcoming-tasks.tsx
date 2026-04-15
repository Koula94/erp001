"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dashboardApi, UpcomingTask as UpcomingTaskType } from "@/lib/dashboard-api"
import { Calendar, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const priorityColors = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-green-500/10 text-green-700 dark:text-green-400",
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<UpcomingTaskType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUpcomingTasks() {
      try {
        const data = await dashboardApi.getUpcomingTasks()
        setTasks(data)
      } catch (error) {
        console.error('Error fetching upcoming tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingTasks()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Tasks due in the next week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-5 bg-muted rounded animate-pulse w-12"></div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-3 bg-muted rounded animate-pulse w-16"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Tasks due in the next week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No upcoming tasks
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Tasks due in the next week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{task.title}</p>
                  <Badge variant="outline" className={cn("text-xs", priorityColors[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    <span>{task.project}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
