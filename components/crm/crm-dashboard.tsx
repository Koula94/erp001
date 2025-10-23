"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Mail, 
  Phone, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

interface DashboardStats {
  totalClients: number
  activeClients: number
  prospectClients: number
  totalQuotes: number
  pendingQuotes: number
  approvedQuotes: number
  totalRevenue: number
  recentCommunications: number
}

interface RecentActivity {
  id: string
  type: "client" | "quote" | "communication"
  title: string
  description: string
  date: string
  status?: string
  amount?: number
}

export function CRMDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    prospectClients: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    totalRevenue: 0,
    recentCommunications: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load clients data
      const clientsResponse = await api.clients.list() as any
      const clients = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.results || clientsResponse.data || []
      
      // Load quotes data
      const quotesResponse = await api.quotes.list() as any
      const quotes = Array.isArray(quotesResponse) ? quotesResponse : quotesResponse.results || quotesResponse.data || []
      
      // Load communications data
      const communicationsResponse = await api.communications.list() as any
      const communications = Array.isArray(communicationsResponse) ? communicationsResponse : communicationsResponse.results || communicationsResponse.data || []

      // Calculate stats
      const totalClients = clients.length
      const activeClients = clients.filter((client: any) => client.status === 'active').length
      const prospectClients = clients.filter((client: any) => client.status === 'prospect').length
      const totalQuotes = quotes.length
      const pendingQuotes = quotes.filter((quote: any) => quote.status === 'pending').length
      const approvedQuotes = quotes.filter((quote: any) => quote.status === 'approved').length
      const totalRevenue = quotes
        .filter((quote: any) => quote.status === 'approved')
        .reduce((sum: number, quote: any) => sum + parseFloat(quote.amount), 0)
      const recentCommunications = communications.length

      setStats({
        totalClients,
        activeClients,
        prospectClients,
        totalQuotes,
        pendingQuotes,
        approvedQuotes,
        totalRevenue,
        recentCommunications
      })

      // Generate recent activities
      const activities: RecentActivity[] = []

      // Add recent clients
      clients.slice(0, 3).forEach((client: any) => {
        activities.push({
          id: client.id,
          type: "client",
          title: `New Client: ${client.name}`,
          description: `Contact: ${client.contact_person}`,
          date: client.created_at,
          status: client.status
        })
      })

      // Add recent quotes
      quotes.slice(0, 3).forEach((quote: any) => {
        activities.push({
          id: quote.id,
          type: "quote",
          title: `New Quote: ${quote.project_name}`,
          description: `Client: ${quote.client_name}`,
          date: quote.created_at,
          status: quote.status,
          amount: parseFloat(quote.amount)
        })
      })

      // Add recent communications
      communications.slice(0, 3).forEach((comm: any) => {
        activities.push({
          id: comm.id,
          type: "communication",
          title: `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}: ${comm.subject}`,
          description: `With: ${comm.client_name}`,
          date: comm.date,
          status: comm.type
        })
      })

      // Sort by date and take top 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setRecentActivities(sortedActivities)
      setError(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.message || 
                          err?.message || 
                          "Failed to load dashboard data"
      setError(errorMessage)
      console.error("Error loading dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case 'prospect':
      case 'pending':
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case 'inactive':
      case 'rejected':
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case 'email':
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case 'call':
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case 'meeting':
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4" />
      case 'quote':
        return <FileText className="h-4 w-4" />
      case 'communication':
        return <Mail className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-green-600 mr-1">{stats.activeClients} active</span>
              <span>•</span>
              <span className="text-blue-600 ml-1">{stats.prospectClients} prospects</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-yellow-600 mr-1">{stats.pendingQuotes} pending</span>
              <span>•</span>
              <span className="text-green-600 ml-1">{stats.approvedQuotes} approved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From approved quotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCommunications}</div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest client interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="outline" className={getStatusColor(activity.status || '')}>
                        {activity.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common CRM tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/crm?tab=clients')}
            >
              <Users className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/crm?tab=quotes')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Quote
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/crm?tab=communications')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/crm?tab=clients')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Clients
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Key CRM performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Prospects to Active</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Quote Success</p>
                  <p className="text-2xl font-bold">
                    {stats.totalQuotes > 0 ? Math.round((stats.approvedQuotes / stats.totalQuotes) * 100) : 0}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Approval Rate</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avg. Quote Value</p>
                  <p className="text-2xl font-bold">
                    ${stats.approvedQuotes > 0 ? Math.round(stats.totalRevenue / stats.approvedQuotes).toLocaleString() : 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Per Approved Quote</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Engagement</p>
                  <p className="text-2xl font-bold">
                    {stats.totalClients > 0 ? Math.round(stats.recentCommunications / stats.totalClients) : 0}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Comms per Client</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
