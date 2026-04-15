"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Mail, Phone, Users, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { CommunicationFormDialog } from "./communication-form-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, usePagination } from "@/components/ui/pagination"

const typeIcons = {
  email: Mail,
  call: Phone,
  meeting: Users,
}

const typeColors = {
  email: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  call: "bg-green-500/10 text-green-700 dark:text-green-400",
  meeting: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
}

interface Communication {
  id: string
  client: number
  client_name: string
  type: "email" | "call" | "meeting"
  subject: string
  content: string
  date: string
  user: number
  user_name: string
}

export function CommunicationsTab() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [communications, setCommunications] = useState<Communication[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Number of items per page

  useEffect(() => {
    loadCommunications()
  }, [])

  const loadCommunications = async () => {
    try {
      setLoading(true)
      const response = await api.communications.list() as any
      // Handle potential paginated response or direct array
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setCommunications(data as Communication[])
      setError(null)
    } catch (err) {
      setError("Failed to load communications")
      console.error("Error loading communications:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      comm.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || comm.type === typeFilter
    return matchesSearch && matchesType
  })

  // Apply pagination to filtered communications
  const { paginatedData, totalPages, totalItems } = usePagination(
    filteredCommunications,
    currentPage,
    pageSize
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSaveCommunication = async (communication: any) => {
    try {
      if (!user) {
        setError("You must be logged in to log a communication")
        return
      }
      
      const newCommunication = await api.communications.create({
        client: communication.clientId,
        type: communication.type,
        subject: communication.subject,
        content: communication.content,
        user: user.id, // Use the current logged-in user's ID
      }) as Communication
      setCommunications([newCommunication, ...communications])
    } catch (err) {
      setError("Failed to save communication")
      console.error("Error saving communication:", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Communication
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Communications</CardTitle>
          <CardDescription>Track all client interactions and communications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No communications found matching your search" : "No communications found"}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedData.map((comm) => {
                const Icon = typeIcons[comm.type as keyof typeof typeIcons]
                return (
                  <div key={comm.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{comm.subject}</h4>
                          <p className="text-sm text-muted-foreground">{comm.client_name}</p>
                        </div>
                        <Badge variant="outline" className={typeColors[comm.type as keyof typeof typeColors]}>
                          {comm.type}
                        </Badge>
                      </div>
                      <p className="text-sm">{comm.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(comm.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{comm.user_name}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Pagination */}
          {filteredCommunications.length > pageSize && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CommunicationFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSaveCommunication} />
    </div>
  )
}
