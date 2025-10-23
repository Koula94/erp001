"use client"

import { DollarSign, FolderKanban, Users, Building2 } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { useAuth } from "@/contexts/auth-context"
import { dashboardApi, DashboardStats } from "@/lib/dashboard-api"
import { getUserFullName } from "@/lib/auth"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const dashboardStats = await dashboardApi.getStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user ? getUserFullName(user) : 'User'}. Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user ? getUserFullName(user) : 'User'}. Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats?.revenue.current || 0}
          change={stats?.revenue.change || 0}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects.current || 0}
          change={stats?.activeProjects.change || 0}
          icon={FolderKanban}
        />
        <StatCard
          title="Total Employees"
          value={stats?.employees.current || 0}
          change={stats?.employees.change || 0}
          icon={Users}
        />
        <StatCard
          title="Active Clients"
          value={stats?.clients.current || 0}
          change={stats?.clients.change || 0}
          icon={Building2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart />
        <ProjectStatusChart />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivity />
        <UpcomingTasks />
      </div>
    </div>
  )
}
