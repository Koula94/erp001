"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicesTab } from "@/components/finance/invoices-tab"
import { ExpensesTab } from "@/components/finance/expenses-tab"
import { BudgetsTab } from "@/components/finance/budgets-tab"
import { ReportsTab } from "@/components/finance/reports-tab"
import { OperationsTab } from "@/components/finance/operations-tab"
import { OperationsDashboard } from "@/components/finance/operations-dashboard"
import { FinanceOverview } from "@/components/finance/finance-overview"

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("operations-dashboard")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance & Accounting</h1>
        <p className="text-muted-foreground">Manage invoices, expenses, budgets and financial reports</p>
      </div>

      <FinanceOverview />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="operations-dashboard">Operations Dashboard</TabsTrigger>
          <TabsTrigger value="operations-list">Operations List</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <InvoicesTab />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesTab />
        </TabsContent>

        <TabsContent value="operations-dashboard" className="mt-6">
          <OperationsDashboard />
        </TabsContent>

        <TabsContent value="operations-list" className="mt-6">
          <OperationsTab />
        </TabsContent>

        <TabsContent value="budgets" className="mt-6">
          <BudgetsTab />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
