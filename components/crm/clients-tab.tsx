"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Mail, Phone, MapPin, Building2, Edit, Trash2, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClientFormDialog } from "./client-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pagination, usePagination } from "@/components/ui/pagination"

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  prospect: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: "active" | "prospect" | "inactive"
  contact_person: string
  total_projects: number
  total_revenue: string
  created_at: string
  updated_at: string
}

export function ClientsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Number of items per page

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await api.clients.list() as any
      // Handle potential paginated response or direct array
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setClients(data as Client[])
      setError(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.message || 
                          err?.message || 
                          "Failed to load clients. Please check your connection and try again."
      setError(errorMessage)
      console.error("Error loading clients:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Apply pagination to filtered clients
  const { paginatedData, totalPages, totalItems } = usePagination(
    filteredClients,
    currentPage,
    pageSize
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSaveClient = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update existing client
        const updatedClient = await api.clients.update(editingClient.id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          status: clientData.status,
          contact_person: clientData.contactPerson,
        }) as Client
        setClients(clients.map((c) => (c.id === editingClient.id ? updatedClient : c)))
      } else {
        // Create new client
        const newClient = await api.clients.create({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          status: clientData.status,
          contact_person: clientData.contactPerson,
        }) as Client
        setClients([...clients, newClient])
      }
      setEditingClient(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.message || 
                          err?.message || 
                          "Failed to save client. Please check the data and try again."
      setError(errorMessage)
      console.error("Error saving client:", err)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.clients.delete(clientId)
      setClients(clients.filter((c) => c.id !== clientId))
      setDeletingClientId(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 
                          err?.response?.data?.message || 
                          err?.message || 
                          "Failed to delete client. The client may be referenced by other records."
      setError(errorMessage)
      console.error("Error deleting client:", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditingClient(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>Gérer les relations client et contact</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No clients found matching your search" : "No clients found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du client</TableHead>
                  <TableHead>Personne de contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Projets</TableHead>
                  <TableHead>Revenu</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contact_person}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[client.status]}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.total_projects}</TableCell>
                    <TableCell>${parseFloat(client.total_revenue).toLocaleString()}</TableCell>
                    <TableCell>{new Date(client.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{client.name}</DialogTitle>
                              <DialogDescription>Détails et informations sur le client</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Personne de contact:</span>
                                    <span>{client.contact_person}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Email:</span>
                                    <span>{client.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Téléphone:</span>
                                    <span>{client.phone}</span>
                                  </div>
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <span className="font-medium">Adresse:</span>
                                      <p className="text-muted-foreground">{client.address}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm">Statistiques</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total des projets:</span>
                                        <span className="font-medium">{client.total_projects}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Revenu total:</span>
                                        <span className="font-medium">${parseFloat(client.total_revenue).toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Statut:</span>
                                        <Badge variant="outline" className={statusColors[client.status]}>
                                          {client.status}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Dernière mise à jour:</span>
                                        <span className="font-medium">
                                          {new Date(client.updated_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClient(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingClientId(client.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {filteredClients.length > pageSize && (
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

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={editingClient || undefined}
        onSave={handleSaveClient}
      />

      <AlertDialog open={!!deletingClientId} onOpenChange={() => setDeletingClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingClientId && handleDeleteClient(deletingClientId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
