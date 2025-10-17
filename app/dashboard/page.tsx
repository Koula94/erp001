"use client"

import { DollarSign, FolderKanban, Users, Building2 } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { dashboardStats } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={dashboardStats.revenue.current}
          change={dashboardStats.revenue.change}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Active Projects"
          value={dashboardStats.activeProjects.current}
          change={dashboardStats.activeProjects.change}
          icon={FolderKanban}
        />
        <StatCard
          title="Total Employees"
          value={dashboardStats.employees.current}
          change={dashboardStats.employees.change}
          icon={Users}
        />
        <StatCard
          title="Active Clients"
          value={dashboardStats.clients.current}
          change={dashboardStats.clients.change}
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
