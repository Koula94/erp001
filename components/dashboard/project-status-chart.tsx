"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { dashboardApi, ProjectStatusData } from "@/lib/dashboard-api"
import { useEffect, useState } from "react"

export function ProjectStatusChart() {
  const [projectStatusData, setProjectStatusData] = useState<ProjectStatusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjectStatusData() {
      try {
        const data = await dashboardApi.getProjectStatusData()
        setProjectStatusData(data)
      } catch (error) {
        console.error('Error fetching project status data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectStatusData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>Current distribution of all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">Loading project status data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projectStatusData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>Current distribution of all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-muted-foreground">No project data available</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
        <CardDescription>Current distribution of all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={projectStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
