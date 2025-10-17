"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Wrench, Calendar } from "lucide-react"
import { equipment } from "@/lib/mock-data"
import { EquipmentFormDialog } from "./equipment-form-dialog"

const statusColors = {
  available: "bg-green-500/10 text-green-700 dark:text-green-400",
  "in-use": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  maintenance: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  retired: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const conditionColors = {
  excellent: "bg-green-500/10 text-green-700 dark:text-green-400",
  good: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  fair: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  poor: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export function EquipmentTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [equipmentData, setEquipmentData] = useState(equipment)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<any>(null)

  const filteredEquipment = equipmentData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalValue = equipmentData.reduce((sum, eq) => sum + eq.value, 0)
  const availableCount = equipmentData.filter((eq) => eq.status === "available").length

  const handleAddEquipment = (data: any) => {
    const newEquipment = {
      ...data,
      id: `EQ-${String(equipmentData.length + 1).padStart(3, "0")}`,
    }
    setEquipmentData([...equipmentData, newEquipment])
  }

  const handleEditEquipment = (data: any) => {
    setEquipmentData(
      equipmentData.map((eq) =>
        eq.id === editingEquipment.id
          ? {
              ...data,
              id: eq.id,
            }
          : eq,
      ),
    )
    setEditingEquipment(null)
  }

  const handleDeleteEquipment = (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      setEquipmentData(equipmentData.filter((eq) => eq.id !== id))
    }
  }

  const openEditDialog = (equipment: any) => {
    setEditingEquipment(equipment)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment Value</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{equipmentData.length} equipment items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipmentData.filter((eq) => eq.status === "in-use").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently assigned</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipment.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.category}</CardDescription>
                </div>
                <Badge variant="outline" className={statusColors[item.status]}>
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Condition:</span>
                <Badge variant="outline" className={conditionColors[item.condition]}>
                  {item.condition}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{item.location}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-medium">${item.value.toLocaleString()}</span>
              </div>
              {item.assignedProject && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Assigned to:</p>
                  <p className="text-sm font-medium">{item.assignedProject}</p>
                </div>
              )}
              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Last: {new Date(item.lastMaintenance).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Next: {new Date(item.nextMaintenance).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="pt-3 border-t flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => openEditDialog(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700 bg-transparent"
                  onClick={() => handleDeleteEquipment(item.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EquipmentFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingEquipment(null)
        }}
        onSubmit={editingEquipment ? handleEditEquipment : handleAddEquipment}
        initialData={editingEquipment}
      />
    </div>
  )
}
