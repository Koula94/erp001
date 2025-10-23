import { api } from "./api"

export interface DashboardStats {
  revenue: {
    current: number
    change: number
  }
  activeProjects: {
    current: number
    change: number
  }
  employees: {
    current: number
    change: number
  }
  clients: {
    current: number
    change: number
  }
}

export interface RevenueData {
  month: string
  revenue: number
  expenses: number
}

export interface ProjectStatusData {
  status: string
  count: number
  color: string
  [key: string]: string | number // Index signature for Recharts compatibility
}

export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  user: string
}

export interface UpcomingTask {
  id: string
  title: string
  project: string
  dueDate: string
  priority: "low" | "medium" | "high"
}

interface ApiClient {
  id: string
  name?: string
}

interface ApiProject {
  id: string
  name?: string
  status?: string
}

interface ApiEmployee {
  id: string
  name?: string
}

interface ApiInvoice {
  id: string
  total_amount?: number
  created_at?: string
  date?: string
  invoice_number?: string
}

interface ApiExpense {
  id: string
  amount?: number
  date?: string
  created_at?: string
}

interface ApiTask {
  id: string
  title?: string
  due_date?: string
  priority?: string
  project?: { name?: string }
  assigned_to?: { name?: string }
  created_at?: string
}

interface ApiCommunication {
  id: string
  subject?: string
  created_at?: string
  created_by?: { name?: string }
}

class DashboardApi {
  async getStats(): Promise<DashboardStats> {
    try {
      // Récupérer les données de différentes APIs pour calculer les stats
      const [clientsData, projectsData, employeesData, invoicesData] = await Promise.all([
        api.clients.list().catch(() => []),
        api.projects.list().catch(() => []),
        api.employees.list().catch(() => []),
        api.invoices.list().catch(() => [])
      ])

      // Ensure we always have arrays, even if API returns null/undefined
      const clients = Array.isArray(clientsData) ? clientsData : []
      const projects = Array.isArray(projectsData) ? projectsData : []
      const employees = Array.isArray(employeesData) ? employeesData : []
      const invoices = Array.isArray(invoicesData) ? invoicesData : []

      // Calculer les statistiques
      const totalRevenue = invoices.reduce((sum: number, invoice: ApiInvoice) => 
        sum + (invoice.total_amount || 0), 0
      )
      
      const activeProjects = projects.filter((project: ApiProject) => 
        project.status === 'in_progress' || project.status === 'active'
      ).length

      return {
        revenue: {
          current: totalRevenue,
          change: 12.5 // Pourcentage de changement (à calculer avec les données historiques)
        },
        activeProjects: {
          current: activeProjects,
          change: 8.2
        },
        employees: {
          current: employees.length,
          change: 5.7
        },
        clients: {
          current: clients.length,
          change: 15.3
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        revenue: { current: 0, change: 0 },
        activeProjects: { current: 0, change: 0 },
        employees: { current: 0, change: 0 },
        clients: { current: 0, change: 0 }
      }
    }
  }

  async getRevenueData(): Promise<RevenueData[]> {
    try {
      const [invoicesData, expensesData] = await Promise.all([
        api.invoices.list().catch(() => []),
        api.expenses.list().catch(() => [])
      ])
      
      // Ensure we always have arrays, even if API returns null/undefined
      const invoices = Array.isArray(invoicesData) ? invoicesData : []
      const expenses = Array.isArray(expensesData) ? expensesData : []
      
      // Grouper par mois (simplifié pour l'exemple)
      // Dans une implémentation réelle, vous voudriez grouper par date
      const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {}
      
      invoices.forEach((invoice: any) => {
        const month = new Date(invoice.created_at || invoice.date || new Date()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 }
        }
        monthlyData[month].revenue += invoice.total_amount || 0
      })
      
      expenses.forEach((expense: any) => {
        const month = new Date(expense.date || expense.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 }
        }
        monthlyData[month].expenses += expense.amount || 0
      })
      
      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses
      })).slice(-6) // Derniers 6 mois
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      return []
    }
  }

  async getProjectStatusData(): Promise<ProjectStatusData[]> {
    try {
      const projectsData = await api.projects.list().catch(() => [])
      
      // Ensure we always have arrays, even if API returns null/undefined
      const projects = Array.isArray(projectsData) ? projectsData : []
      
      const statusCounts: { [key: string]: number } = {}
      projects.forEach((project: any) => {
        const status = project.status || 'unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      
      const statusColors: { [key: string]: string } = {
        'planned': 'hsl(var(--chart-1))',
        'in_progress': 'hsl(var(--chart-2))',
        'completed': 'hsl(var(--chart-3))',
        'on_hold': 'hsl(var(--chart-4))',
        'cancelled': 'hsl(var(--chart-5))',
        'unknown': 'hsl(var(--muted-foreground))'
      }
      
      return Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        count,
        color: statusColors[status] || statusColors['unknown']
      }))
    } catch (error) {
      console.error('Error fetching project status data:', error)
      return []
    }
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      // Récupérer les activités récentes de différentes sources
      const [tasksData, communicationsData, invoicesData] = await Promise.all([
        api.tasks.list().catch(() => []),
        api.communications.list().catch(() => []),
        api.invoices.list().catch(() => [])
      ])
      
      // Ensure we always have arrays, even if API returns null/undefined
      const tasks = Array.isArray(tasksData) ? tasksData : []
      const communications = Array.isArray(communicationsData) ? communicationsData : []
      const invoices = Array.isArray(invoicesData) ? invoicesData : []
      
      const activities: RecentActivity[] = []
      
      // Ajouter les tâches récentes
      tasks.slice(0, 3).forEach((task: any) => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          description: `New task created in project`,
          timestamp: task.created_at || new Date().toISOString(),
          user: task.assigned_to?.name || 'System'
        })
      })
      
      // Ajouter les communications récentes
      communications.slice(0, 2).forEach((comm: any) => {
        activities.push({
          id: `comm-${comm.id}`,
          type: 'communication',
          title: comm.subject,
          description: `New communication with client`,
          timestamp: comm.created_at || new Date().toISOString(),
          user: comm.created_by?.name || 'System'
        })
      })
      
      // Ajouter les factures récentes
      invoices.slice(0, 2).forEach((invoice: any) => {
        activities.push({
          id: `invoice-${invoice.id}`,
          type: 'invoice',
          title: `Invoice #${invoice.invoice_number}`,
          description: `New invoice created`,
          timestamp: invoice.created_at || new Date().toISOString(),
          user: 'Finance Team'
        })
      })
      
      // Trier par date et limiter à 5 éléments
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  async getUpcomingTasks(): Promise<UpcomingTask[]> {
    try {
      const tasksData = await api.tasks.list().catch(() => [])
      
      // Ensure we always have arrays, even if API returns null/undefined
      const tasks = Array.isArray(tasksData) ? tasksData : []
      
      // Filtrer les tâches à venir (dans les 7 prochains jours)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const upcomingTasks = tasks
        .filter((task: any) => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          return dueDate >= now && dueDate <= nextWeek
        })
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          project: task.project?.name || 'Unknown Project',
          dueDate: task.due_date,
          priority: task.priority || 'medium'
        }))
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
      
      return upcomingTasks
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error)
      return []
    }
  }
}

export const dashboardApi = new DashboardApi()
