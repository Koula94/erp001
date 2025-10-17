"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  start_date: string
  end_date: string
  progress: number
  status: string
  assignee: string
}

interface GanttChartProps {
  tasks: Task[]
  projectStartDate: string
  projectEndDate: string
}

export function GanttChart({ tasks, projectStartDate, projectEndDate }: GanttChartProps) {
  const startDate = new Date(projectStartDate)
  const endDate = new Date(projectEndDate)
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const monthsInProject = Math.ceil(totalDays / 30)

  const getTaskPosition = (taskStart: string, taskEnd: string) => {
    const taskStartDate = new Date(taskStart)
    const taskEndDate = new Date(taskEnd)
    const startOffset = Math.ceil((taskStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      default:
        return "bg-gray-400"
    }
  }

  const months = Array.from({ length: monthsInProject }, (_, i) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline (Gantt Chart)</CardTitle>
        <CardDescription>Visual representation of project tasks and their schedules</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline header */}
            <div className="flex border-b mb-4 pb-2">
              <div className="w-48 font-medium text-sm">Task</div>
              <div className="flex-1 flex">
                {months.map((month, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {tasks.map((task) => {
                const position = getTaskPosition(task.start_date , task.end_date)
                return (
                  <div key={task.id} className="flex items-center">
                    <div className="w-48 pr-4">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.assignee}</p>
                    </div>
                    <div className="flex-1 relative h-10">
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                        <div
                          className={cn("absolute h-6 rounded-md flex items-center px-2", getStatusColor(task.status))}
                          style={position}
                        >
                          <span className="text-xs text-white font-medium truncate">{task.progress}%</span>
                        </div>
                      </div>
                      {/* Grid lines */}
                      {months.map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-0 border-l border-gray-200"
                          style={{ left: `${(i / monthsInProject) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <span className="text-sm">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
