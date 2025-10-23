"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CRMDashboard } from "@/components/crm/crm-dashboard"
import { ClientsTab } from "@/components/crm/clients-tab"
import { QuotesTab } from "@/components/crm/quotes-tab"
import { CommunicationsTab } from "@/components/crm/communications-tab"

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">Manage clients, quotes, and communications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <CRMDashboard />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsTab />
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <QuotesTab />
        </TabsContent>

        <TabsContent value="communications" className="mt-6">
          <CommunicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
