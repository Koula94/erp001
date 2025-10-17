"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmployeesTab } from "@/components/hr/employees-tab"
import { PayrollTab } from "@/components/hr/payroll-tab"
import { LeaveTab } from "@/components/hr/leave-tab"
import { PerformanceTab } from "@/components/hr/performance-tab"

export default function HRPage() {
  const [activeTab, setActiveTab] = useState("employees")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
        <p className="text-muted-foreground">Manage employees, payroll, and performance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <EmployeesTab />
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <PayrollTab />
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          <LeaveTab />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
