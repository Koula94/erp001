"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Wrench, Calendar, Edit, Trash2, Filter } from "lucide-react"
import { api } from "@/lib/api"
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
  const [equipmentData, setEquipmentData] = useState<any[]>([])
  const [projectsData, setProjectsData] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [conditionFilter, setConditionFilter] = useState("")

  useEffect(() => {
    loadEquipment()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await api.projects.list() as any
      const data = Array.isArray(response) ? response : 
                   (response as any)?.results || (response as any)?.data || []
      setProjectsData(data)
    } catch (error) {
      console.error("Error loading projects:", error)
      setProjectsData([])
    }
  }

  const loadEquipment = async () => {
    try {
      setLoading(true)
      const response = await api.equipment.list() as any
      console.log("Equipment API response:", response)
      // Handle different response formats
      const data = Array.isArray(response) ? response : 
                   (response as any)?.results || (response as any)?.data || []
      console.log("Equipment data structure:", data)
      setEquipmentData(data)
    } catch (error) {
      console.error("Error loading equipment:", error)
      setEquipmentData([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories, statuses, and conditions for filters
  const categories = Array.from(new Set(equipmentData
    .map(eq => eq.category)
    .filter(category => category && category.trim() !== "")
  )).sort()
  const statuses = Array.from(new Set(equipmentData
    .map(eq => eq.status)
    .filter(status => status && status.trim() !== "")
  )).sort()
  const conditions = Array.from(new Set(equipmentData
    .map(eq => eq.condition)
    .filter(condition => condition && condition.trim() !== "")
  )).sort()

  console.log("Categories for filter:", categories)
  console.log("Statuses for filter:", statuses)
  console.log("Conditions for filter:", conditions)
  
  // Filter equipment
  const filteredEquipment = equipmentData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    const matchesStatus = !statusFilter || item.status === statusFilter
    const matchesCondition = !conditionFilter || item.condition === conditionFilter
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition
  })

  const totalValue = equipmentData.reduce((sum, eq) => {
    // Try different possible field names for value
    const value = eq.value || eq.unit_price || eq.price || eq.cost || 0
    console.log(`Equipment ${eq.name}: value=${value}`)
    return sum + Number(value)
  }, 0)
  const availableCount = equipmentData.filter((eq) => eq.status === "available").length

  const handleAddEquipment = async (data: any) => {
    try {
      // Find the project ID by name (skip if "not-assigned")
      const selectedProject = data.assignedProject && data.assignedProject !== "not-assigned" ? 
        projectsData.find(p => p.name === data.assignedProject) : null

      // Convert camelCase to snake_case for Django API
      const apiData = {
        name: data.name,
        category: data.category,
        status: data.status,
        condition: data.condition,
        location: data.location,
        value: data.value,
        assigned_to: selectedProject?.id || null,
        purchase_date: data.purchaseDate,
        last_maintenance: data.lastMaintenance,
        next_maintenance: data.nextMaintenance,
      }
      console.log("Sending equipment data to API:", apiData)
      const newEquipment = await api.equipment.create(apiData)
      setEquipmentData([...equipmentData, newEquipment])
    } catch (error) {
      console.error("Error adding equipment:", error)
      throw error
    }
  }

  const handleEditEquipment = async (data: any) => {
    try {
      // Find the project ID by name (skip if "not-assigned")
      const selectedProject = data.assignedProject && data.assignedProject !== "not-assigned" ? 
        projectsData.find(p => p.name === data.assignedProject) : null

      // Convert camelCase to snake_case for Django API
      const apiData = {
        name: data.name,
        category: data.category,
        status: data.status,
        condition: data.condition,
        location: data.location,
        value: data.value,
        assigned_to: selectedProject?.id || null,
        purchase_date: data.purchaseDate,
        last_maintenance: data.lastMaintenance,
        next_maintenance: data.nextMaintenance,
      }
      console.log("Sending update equipment data to API:", apiData)
      const updatedEquipment = await api.equipment.update(editingEquipment.id, apiData)
      setEquipmentData(
        equipmentData.map((eq) =>
          eq.id === editingEquipment.id ? updatedEquipment : eq,
        ),
      )
      setEditingEquipment(null)
    } catch (error) {
      console.error("Error updating equipment:", error)
      throw error
    }
  }

  const handleDeleteEquipment = async (id: string) => {
    if (confirm("Are you sure you want to delete this equipment?")) {
      try {
        await api.equipment.delete(id)
        setEquipmentData(equipmentData.filter((eq) => eq.id !== id))
      } catch (error) {
        console.error("Error deleting equipment:", error)
      }
    }
  }

  const openEditDialog = (equipment: any) => {
    setEditingEquipment(equipment)
    setIsDialogOpen(true)
  }

  const clearFilters = () => {
    setCategoryFilter("")
    setStatusFilter("")
    setConditionFilter("")
    setSearchQuery("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment Value (GNF)</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} GNF</div>
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

      <div className="flex flex-col gap-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
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
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
            
            {(categoryFilter || statusFilter || conditionFilter || searchQuery) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
        
        {/* Filter Summary */}
        {(categoryFilter || statusFilter || conditionFilter || searchQuery) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtered by: </span>
            {searchQuery && <Badge variant="secondary">Search: "{searchQuery}"</Badge>}
            {categoryFilter && <Badge variant="secondary">Category: {categoryFilter}</Badge>}
            {statusFilter && <Badge variant="secondary">Status: {statusFilter}</Badge>}
            {conditionFilter && <Badge variant="secondary">Condition: {conditionFilter}</Badge>}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            Loading equipment...
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="col-span-full text-center py-8">
            No equipment found
          </div>
        ) : (
          filteredEquipment.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </div>
                  <Badge variant="outline" className={statusColors[item.status as keyof typeof statusColors]}>
                    {item.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Condition:</span>
                  <Badge variant="outline" className={conditionColors[item.condition as keyof typeof conditionColors]}>
                    {item.condition}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{item.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium">
                    {(item.value || item.unit_price || item.price || item.cost || 0).toLocaleString()} GNF
                  </span>
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
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(item)}
                    title="Edit equipment"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteEquipment(item.id)}
                    title="Delete equipment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EquipmentFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingEquipment(null)
        }}
        onSubmit={editingEquipment ? handleEditEquipment : handleAddEquipment}
        initialData={editingEquipment}
        projects={projectsData}
      />
    </div>
  )
}
