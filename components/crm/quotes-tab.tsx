"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QuoteFormDialog } from "./quote-form-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination, usePagination } from "@/components/ui/pagination"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
}

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price: string
  total: string
}

interface Quote {
  id: string
  client: number
  client_name: string
  project_name: string
  amount: string
  status: "pending" | "approved" | "rejected"
  valid_until: string
  created_at: string
  created_by: number
  items: QuoteItem[]
}

export function QuotesTab() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10 // Number of items per page

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const response = await api.quotes.list() as any
      // Handle potential paginated response or direct array
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setQuotes(data as Quote[])
      setError(null)
    } catch (err) {
      setError("Failed to load quotes")
      console.error("Error loading quotes:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.project_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Apply pagination to filtered quotes
  const { paginatedData, totalPages, totalItems } = usePagination(
    filteredQuotes,
    currentPage,
    pageSize
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSaveQuote = async (quote: any) => {
    try {
      console.log("Saving quote data:", quote)
      
      if (!user) {
        setError("You must be logged in to create a quote")
        return
      }
      
      // Format the data according to API documentation
      const quoteData = {
        client: parseInt(quote.clientId),
        project_name: quote.projectName,
        amount: quote.amount.toFixed(2), // Format as string with 2 decimal places
        status: "pending", // Default status
        valid_until: quote.validUntil,
        created_by: user.id, // Use the current logged-in user's ID
        items: quote.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice.toFixed(2), // Format as string with 2 decimal places
        }))
      }
      
      console.log("Quote data to send:", quoteData)
      
      const newQuote = await api.quotes.create(quoteData) as Quote
      console.log("Quote saved successfully:", newQuote)
      setQuotes([newQuote, ...quotes])
    } catch (err: any) {
      const errorMessage = err?.response?.data || err?.message || "Unknown error"
      setError(`Failed to save quote: ${JSON.stringify(errorMessage)}`)
      console.error("Error saving quote:", err)
      console.error("Error response:", err?.response?.data)
      console.error("Error status:", err?.response?.status)
    }
  }

  const handleUpdateStatus = async (quoteId: string, status: "pending" | "approved" | "rejected") => {
    try {
      console.log("Updating quote status:", { quoteId, status })
      
      // Try PATCH first (partial update), fall back to PUT if needed
      let updatedQuote
      try {
        // Use PATCH for partial updates
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/crm/quotes/${quoteId}/`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
        
        updatedQuote = await response.json()
      } catch (patchError) {
        console.log("PATCH failed, trying PUT:", patchError)
        
        // Fall back to PUT with full data
        const quote = quotes.find(q => q.id.toString() === quoteId)
        if (!quote) {
          throw new Error("Quote not found")
        }
        
        const fullData = {
          client: quote.client,
          project_name: quote.project_name,
          amount: quote.amount,
          status: status,
          valid_until: quote.valid_until,
          created_by: quote.created_by,
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/crm/quotes/${quoteId}/`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullData)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
        
        updatedQuote = await response.json()
      }
      
      console.log("Quote updated successfully:", updatedQuote)
      setQuotes(quotes.map((q) => (q.id.toString() === quoteId ? updatedQuote : q)))
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error"
      setError(`Failed to update quote status: ${errorMessage}`)
      console.error("Error updating quote status:", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
          <CardDescription>Gérer les devis et les propositions de projets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No quotes found matching your search" : "No quotes found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Valable jusqu'au</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.id}</TableCell>
                    <TableCell>{quote.client_name}</TableCell>
                    <TableCell>{quote.project_name}</TableCell>
                    <TableCell>${parseFloat(quote.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[quote.status]}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(quote.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Voir
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Détails du devis - {quote.id}</DialogTitle>
                              <DialogDescription>{quote.project_name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Client:</span> {quote.client_name}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Créé:</span>{" "}
                                    {new Date(quote.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Valable jusqu'au:</span>{" "}
                                    {new Date(quote.valid_until).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Statut:</span>{" "}
                                    <Badge variant="outline" className={statusColors[quote.status]}>
                                      {quote.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Montant Total:</span> ${parseFloat(quote.amount).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-3">Articles de devis</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Description</TableHead>
                                      <TableHead>Quantité</TableHead>
                                      <TableHead>Prix ​​unitaire</TableHead>
                                      <TableHead>Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {quote.items.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>${parseFloat(item.unit_price).toLocaleString()}</TableCell>
                                        <TableCell>${parseFloat(item.total).toLocaleString()}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-right font-medium">
                                        Total:
                                      </TableCell>
                                      <TableCell className="font-bold">${parseFloat(quote.amount).toLocaleString()}</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Mettre à jour
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, "pending")}>
                              <FileText className="mr-2 h-4 w-4" />
                              En attente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, "approved")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approuver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, "rejected")}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {filteredQuotes.length > pageSize && (
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

      <QuoteFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSaveQuote} />
    </div>
  )
}
