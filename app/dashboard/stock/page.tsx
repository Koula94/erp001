"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaterialsTab } from "@/components/stock/materials-tab"
import { EquipmentTab } from "@/components/stock/equipment-tab"
import { TransactionsTab } from "@/components/stock/transactions-tab"
import { WarehousesTab } from "@/components/stock/warehouses-tab"

export default function StockPage() {
  const [activeTab, setActiveTab] = useState("materials")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock & Inventory</h1>
        <p className="text-muted-foreground">Manage materials, equipment, and warehouse inventory</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-6">
          <MaterialsTab />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <EquipmentTab />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-6">
          <WarehousesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
