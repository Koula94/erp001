"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Edit, Trash2, Loader2, Download, Eye } from "lucide-react"
import { api } from "@/lib/api"
import { InvoiceFormDialog } from "./invoice-form-dialog"
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
import { useToast } from "@/hooks/use-toast"

const statusColors: { [key: string]: string } = {
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  sent: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
}

interface Invoice {
  id: string
  invoice_number: string
  client: number
  client_name: string
  project?: number
  project_name?: string
  amount: number
  status: string
  due_date: string
  issue_date?: string
  notes?: string
  items: InvoiceItem[]
}

interface InvoiceFormData {
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  invoice_number?: string
  status: string
  dueDate: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
  notes: string
}

interface ApiResponse<T> {
  results?: T[]
  data?: T[]
}

export function InvoicesTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.invoices.list() as ApiResponse<Invoice>
      const data = Array.isArray(response) ? response : response.results || response.data || []
      setInvoices(data as Invoice[])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Échec du chargement des factures"
      setError(errorMessage)
      toast({
        title: "Erreur lors du chargement des factures",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Erreur lors du chargement des factures :", err)
    } finally {
      setLoading(false)
    }
  }, [toast])

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices
    
    const query = searchQuery.toLowerCase().trim()
    return invoices.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(query) ||
        (invoice.client_name || "").toLowerCase().includes(query) ||
        (invoice.project_name || "").toLowerCase().includes(query) ||
        invoice.status.toLowerCase().includes(query)
    )
  }, [invoices, searchQuery])

  const invoiceStats = useMemo(() => {
    const totalInvoices = invoices.length
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue').length
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length
    
    return {
      totalInvoices,
      totalAmount,
      overdueInvoices,
      paidInvoices
    }
  }, [invoices])

  const handleSaveInvoice = useCallback(async (invoiceData: any) => {
    try {
      setSaving(true)
      
      // Validation des données obligatoires
      if (!invoiceData.clientId) {
        throw new Error("Le client est obligatoire")
      }
      
      const totalAmount = invoiceData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
      
      // Convert string IDs to numbers for Django API
      const clientId = parseInt(invoiceData.clientId)
      const projectId = invoiceData.projectId ? parseInt(invoiceData.projectId) : null
      
      console.log("Saving invoice data:", {
        clientId,
        projectId,
        invoice_number: invoiceData.invoice_number,
        amount: totalAmount,
        status: invoiceData.status,
        due_date: invoiceData.dueDate,
        notes: invoiceData.notes,
        items: invoiceData.items
      })
      
      if (editingInvoice) {
        // Update existing invoice - include issue_date from existing invoice
        const updateData = {
          client: clientId,
          project: projectId,
          invoice_number: invoiceData.invoice_number || editingInvoice.invoice_number,
          amount: totalAmount,
          status: invoiceData.status,
          issue_date: editingInvoice.issue_date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate,
          notes: invoiceData.notes || "",
          items: invoiceData.items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
          })),
        }
        console.log("Update data:", updateData)
        
        const updatedInvoice = await api.invoices.update(editingInvoice.id, updateData) as Invoice
        setInvoices(invoices.map((i) => (i.id === editingInvoice.id ? updatedInvoice : i)))
        toast({
          title: "Facture mise à jour",
          description: `La facture ${updatedInvoice.invoice_number} a été mise à jour avec succès.`,
        })
      } else {
        // Create new invoice
        const createData = {
          client: clientId,
          project: projectId,
          invoice_number: `INV-${Date.now()}`,
          amount: totalAmount,
          status: invoiceData.status,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: invoiceData.dueDate,
          notes: invoiceData.notes || "",
          items: invoiceData.items.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
          })),
        }
        console.log("Create data:", createData)
        
        const newInvoice = await api.invoices.create(createData) as Invoice
        setInvoices([...invoices, newInvoice])
        toast({
          title: "Facture créée",
          description: `La facture ${newInvoice.invoice_number} a été créée avec succès.`,
        })
      }
      setIsFormOpen(false)
      setEditingInvoice(null)
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la facture :", err)
      
      // Improved error handling
      let errorMessage = "Échec de l'enregistrement de la facture"
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any
        if (errorObj.message) {
          errorMessage = errorObj.message
        } else if (errorObj.response?.data) {
          // Handle Django REST Framework validation errors
          const data = errorObj.response.data
          if (typeof data === 'string') {
            errorMessage = data
          } else if (data.detail) {
            errorMessage = data.detail
          } else if (data.client) {
            errorMessage = `Client: ${data.client.join(', ')}`
          } else if (data.non_field_errors) {
            errorMessage = data.non_field_errors.join(', ')
          } else {
            errorMessage = JSON.stringify(data)
          }
        }
      }
      
      toast({
        title: "Erreur lors de l'enregistrement de la facture",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }, [editingInvoice, invoices, toast])

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsFormOpen(true)
  }

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      setDeleting(true)
      await api.invoices.delete(invoiceId)
      const deletedInvoice = invoices.find(i => i.id === invoiceId)
      setInvoices(invoices.filter((i) => i.id !== invoiceId))
      setDeletingInvoiceId(null)
      toast({
        title: "Facture supprimée",
        description: `La facture ${deletedInvoice?.invoice_number || invoiceId} a été supprimée avec succès.`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Échec de la suppression de la facture"
      toast({
        title: "Erreur lors de la suppression de la facture",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Erreur lors de la suppression de la facture :", err)
    } finally {
      setDeleting(false)
    }
  }, [invoices, toast])

  const handleViewInvoice = (invoice: Invoice) => {
    // Show invoice details in a toast
    toast({
      title: `Facture ${invoice.invoice_number}`,
      description: `Client: ${invoice.client_name} | Montant: ${invoice.amount} GNF | Statut: ${invoice.status} | Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString()}`,
    })
    
    // TODO: Implement a proper invoice preview dialog
    console.log("Détails de la facture :", invoice)
  }

  const handleDownloadInvoice = useCallback(async (invoice: Invoice) => {
    try {
      // Create a blob URL for the PDF download
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/finance/invoices/${invoice.id}/download_pdf/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Échec du téléchargement du PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `facture_${invoice.invoice_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "PDF téléchargé",
        description: `La facture ${invoice.invoice_number} a été téléchargée avec succès.`,
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Échec du téléchargement du PDF"
      toast({
        title: "Erreur lors du téléchargement du PDF",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [toast])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des factures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditingInvoice(null)
            setIsFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer une Facture
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Invoice Statistics */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total des Factures</p>
                  <p className="text-2xl font-bold">{invoiceStats.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Montant Total</p>
                  <p className="text-2xl font-bold">GNF{invoiceStats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">GNF</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payées</p>
                  <p className="text-2xl font-bold text-green-600">{invoiceStats.paidInvoices}</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700">
                  Payée
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Retard</p>
                  <p className="text-2xl font-bold text-red-600">{invoiceStats.overdueInvoices}</p>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-700">
                  En Retard
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>Gérez les factures clients et les paiements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? "Aucune facture ne correspond à votre recherche" : "Aucune facture trouvée"}</p>
              <p className="text-sm">Créez votre première facture pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date d'Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client_name || "N/A"}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{invoice.project_name || "N/A"}</TableCell>
                    <TableCell>GNF{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewInvoice(invoice)}
                          title="Voir la facture"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Télécharger le PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditInvoice(invoice)}
                          title="Modifier la facture"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeletingInvoiceId(invoice.id)}
                          title="Supprimer la facture"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveInvoice}
        initialData={editingInvoice ? {
          clientId: editingInvoice.client?.toString() || "",
          clientName: editingInvoice.client_name || "",
          projectId: editingInvoice.project?.toString() || "",
          projectName: editingInvoice.project_name || "",
          invoice_number: editingInvoice.invoice_number,
          status: editingInvoice.status,
          dueDate: editingInvoice.due_date,
          items: editingInvoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price
          })),
          notes: editingInvoice.notes || ""
        } : undefined}
      />

      <AlertDialog open={!!deletingInvoiceId} onOpenChange={() => setDeletingInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement cette facture. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingInvoiceId && handleDeleteInvoice(deletingInvoiceId)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
