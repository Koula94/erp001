"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, Filter, ArrowUpDown } from "lucide-react"
import { api } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { MaterialFormDialog } from "./material-form-dialog"
import { Pagination, usePagination } from "@/components/ui/pagination"

const statusColors = {
  "in-stock": "bg-green-500/10 text-green-700 dark:text-green-400",
  "low-stock": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "out-of-stock": "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function MaterialsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [materialsData, setMaterialsData] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      // First recalculate all statuses to ensure they are up to date
      await api.materials.recalculateStatuses() as any
      
      // Then load the materials with updated statuses
      const response = await api.materials.list() as any
      console.log("Materials API response:", response)
      // Handle different response formats
      const data = Array.isArray(response) ? response : 
                   (response as any)?.results || (response as any)?.data || []
      setMaterialsData(data)
    } catch (error) {
      console.error("Error loading materials:", error)
      setMaterialsData([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories for filter
  const categories = Array.from(new Set(materialsData.map(m => m.category))).sort()
  
  // Filter and sort materials
  const filteredMaterials = materialsData
    .filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           material.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !categoryFilter || material.category === categoryFilter
      const matchesStatus = !statusFilter || material.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Handle numeric fields
      if (sortField === 'quantity' || sortField === 'unit_price') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }
      
      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  // Use pagination hook
  const { paginatedData, totalPages, totalItems } = usePagination(
    filteredMaterials,
    currentPage,
    pageSize
  )

  const totalValue = materialsData.reduce((sum, mat) => sum + ((mat.quantity || 0) * (mat.unit_price || 0)), 0)
  const lowStockCount = materialsData.filter((mat) => mat.status === "low-stock").length

  const handleAddMaterial = async (data: any) => {
    try {
      // Convert camelCase to snake_case for Django API
      const apiData = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        min_stock: data.minStock,
        max_stock: data.maxStock,
        unit_price: data.unitPrice,
        location: data.location,
        supplier: data.supplier,
        last_restocked: data.lastRestocked,
        status: data.status || "in-stock",
      }
      console.log("Sending data to API:", apiData)
      const newMaterial = await api.materials.create(apiData)
      setMaterialsData([...materialsData, newMaterial])
    } catch (error) {
      console.error("Error adding material:", error)
      throw error
    }
  }

  const handleEditMaterial = async (data: any) => {
    try {
      // Convert camelCase to snake_case for Django API
      const apiData = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        min_stock: data.minStock,
        max_stock: data.maxStock,
        unit_price: data.unitPrice,
        location: data.location,
        supplier: data.supplier,
        last_restocked: data.lastRestocked,
        status: data.status || "in-stock",
      }
      console.log("Sending update data to API:", apiData)
      const updatedMaterial = await api.materials.update(editingMaterial.id, apiData)
      setMaterialsData(
        materialsData.map((mat) =>
          mat.id === editingMaterial.id ? updatedMaterial : mat,
        ),
      )
      setEditingMaterial(null)
    } catch (error) {
      console.error("Error updating material:", error)
      throw error
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        await api.materials.delete(id)
        setMaterialsData(materialsData.filter((mat) => mat.id !== id))
      } catch (error) {
        console.error("Error deleting material:", error)
      }
    }
  }

  const openEditDialog = (material: any) => {
    setEditingMaterial(material)
    setIsDialogOpen(true)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const clearFilters = () => {
    setCategoryFilter("")
    setStatusFilter("")
    setSearchQuery("")
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }


  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} GNF</div>
            <p className="text-xs text-muted-foreground mt-1">{materialsData.length} material types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(materialsData.map((m) => m.category)).size}</div>
            <p className="text-xs text-muted-foreground mt-1">Material categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            
            {(categoryFilter || statusFilter || searchQuery) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
        
        {/* Filter Summary */}
        {(categoryFilter || statusFilter || searchQuery) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtered by: </span>
            {searchQuery && <Badge variant="secondary">Search: "{searchQuery}"</Badge>}
            {categoryFilter && <Badge variant="secondary">Category: {categoryFilter}</Badge>}
            {statusFilter && <Badge variant="secondary">Status: {statusFilter}</Badge>}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials Inventory</CardTitle>
          <CardDescription>Track and manage construction materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Material
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Location
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('unit_price')}
                  >
                    <div className="flex items-center gap-1">
                      Unit Price
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading materials...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No materials found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((material) => {
                    // Éviter la division par zéro si max_stock est 0
                    const stockPercentage = material.max_stock > 0 
                      ? (material.quantity / material.max_stock) * 100 
                      : 0
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-xs text-muted-foreground"> {material.quantity} {material.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{material.category}</TableCell>

                        <TableCell>
                          <div className="space-y-2 min-w-[140px]">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium">{stockPercentage.toFixed(0)}%</span>
                              <span className="text-muted-foreground">
                                {material.quantity}/{material.max_stock}
                              </span>
                            </div>
                            <Progress 
                              value={stockPercentage} 
                              className="h-3"
                              style={{
                                backgroundColor: stockPercentage <= 25 ? '#fef2f2' : 
                                               stockPercentage <= 50 ? '#fffbeb' : '#f0fdf4'
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              Min: {material.min_stock} | Max: {material.max_stock} {material.unit}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{material.location}</TableCell>
                        <TableCell> {(material.unit_price || 0).toLocaleString()} GNF</TableCell>
                        <TableCell> {((material.quantity || 0) * (material.unit_price || 0)).toLocaleString()} GNF</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[material.status as keyof typeof statusColors]}>
                            {material.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(material)}
                              title="Edit material"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete material"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                totalItems={filteredMaterials.length}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <MaterialFormDialog
        open={isDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsDialogOpen(open)
          if (!open) setEditingMaterial(null)
        }}
        onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}
        initialData={editingMaterial}
      />
    </div>
  )
}
