"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, AlertTriangle, Package } from "lucide-react"
import { api } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { MaterialFormDialog } from "./material-form-dialog"

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

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
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

  const filteredMaterials = materialsData.filter(
    (material) =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalValue = materialsData.reduce((sum, mat) => sum + (mat.totalValue || 0), 0)
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
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

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materials Inventory</CardTitle>
          <CardDescription>Track and manage construction materials</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Unit Price</TableHead>
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
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No materials found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => {
                  const stockPercentage = (material.quantity / material.maxStock) * 100
                  return (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-xs text-muted-foreground">{material.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>
                        {material.quantity} {material.unit}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <Progress value={stockPercentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {material.minStock} - {material.maxStock} {material.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{material.location}</TableCell>
                      <TableCell>${material.unitPrice}</TableCell>
                      <TableCell>${(material.totalValue || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[material.status as keyof typeof statusColors]}>
                          {material.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(material)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MaterialFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingMaterial(null)
        }}
        onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}
        initialData={editingMaterial}
      />
    </div>
  )
}
