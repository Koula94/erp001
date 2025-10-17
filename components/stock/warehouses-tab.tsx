"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, User, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { useState, useEffect } from "react"
import { WarehouseFormDialog } from "./warehouse-form-dialog"
import { Button } from "@/components/ui/button"

export function WarehousesTab() {
  const [warehousesData, setWarehousesData] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const response = await api.warehouses.list() as any
      console.log("Warehouses API response:", response)
      // Handle different response formats
      const data = Array.isArray(response) ? response : 
                   (response as any)?.results || (response as any)?.data || []
      setWarehousesData(data)
    } catch (error) {
      console.error("Error loading warehouses:", error)
      setWarehousesData([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddWarehouse = async (data: any) => {
    try {
      const newWarehouse = await api.warehouses.create(data)
      setWarehousesData([...warehousesData, newWarehouse])
    } catch (error) {
      console.error("Error adding warehouse:", error)
      throw error
    }
  }

  const handleEditWarehouse = async (data: any) => {
    try {
      const updatedWarehouse = await api.warehouses.update(editingWarehouse.id, data)
      setWarehousesData(
        warehousesData.map((wh) =>
          wh.id === editingWarehouse.id ? updatedWarehouse : wh,
        ),
      )
      setEditingWarehouse(null)
    } catch (error) {
      console.error("Error updating warehouse:", error)
      throw error
    }
  }

  const handleDeleteWarehouse = async (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      try {
        await api.warehouses.delete(id)
        setWarehousesData(warehousesData.filter((wh) => wh.id !== id))
      } catch (error) {
        console.error("Error deleting warehouse:", error)
      }
    }
  }

  const openEditDialog = (warehouse: any) => {
    setEditingWarehouse(warehouse)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            Loading warehouses...
          </div>
        ) : warehousesData.length === 0 ? (
          <div className="col-span-full text-center py-8">
            No warehouses found
          </div>
        ) : (
          warehousesData.map((warehouse) => {
            const occupancyPercentage = (warehouse.occupied / warehouse.capacity) * 100
            return (
              <Card key={warehouse.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {warehouse.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{occupancyPercentage.toFixed(0)}% occupied</span>
                    </div>
                    <Progress value={occupancyPercentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{warehouse.occupied} units</span>
                      <span>{warehouse.capacity} units</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Manager:</span>
                      <span className="font-medium">{warehouse.manager}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {warehouse.categories?.map((category: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => openEditDialog(warehouse)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => handleDeleteWarehouse(warehouse.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <WarehouseFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingWarehouse(null)
        }}
        onSubmit={editingWarehouse ? handleEditWarehouse : handleAddWarehouse}
        initialData={editingWarehouse}
      />
    </div>
  )
}
