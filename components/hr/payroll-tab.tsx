"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Users, TrendingUp, Plus } from "lucide-react"
import { PayrollFormDialog } from "./payroll-form-dialog"
import { api } from "@/lib/api"

const statusColors = {
  processed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
}

interface PayrollRecord {
  id: number
  month: string
  total_payroll: string
  employee_count: number
  status: string
  processed_date: string | null
  created_at: string
}

interface PayrollResponse {
  count: number
  next: string | null
  previous: string | null
  results: PayrollRecord[]
}

export function PayrollTab() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayrollRecords()
    loadEmployees()
  }, [])

  const loadPayrollRecords = async () => {
    try {
      setLoading(true)
      const response = await api.payroll.list() as PayrollResponse
      setPayrollRecords(response.results || [])
    } catch (err: any) {
      setError(err.message || "Failed to load payroll records")
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await api.employees.list() as { results: any[] }
      setEmployees(response.results || [])
    } catch (err: any) {
      console.error("Failed to load employees:", err)
    }
  }

  const totalPayroll = payrollRecords.reduce((sum, record) => sum + Number.parseFloat(record.total_payroll), 0)
  const avgSalary = employees.length > 0 ? totalPayroll / employees.length : 0

  const handleAddPayroll = async (payrollData: any) => {
    try {
      const newPayroll = await api.payroll.create(payrollData) as PayrollRecord
      setPayrollRecords([newPayroll, ...payrollRecords])
    } catch (err: any) {
      setError(err.message || "Failed to add payroll record")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last {payrollRecords.length} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per employee</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>Monthly payroll processing history</CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Process Payroll
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.month}</TableCell>
                  <TableCell>${Number.parseFloat(record.total_payroll).toLocaleString()}</TableCell>
                  <TableCell>{record.employee_count}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[record.status as keyof typeof statusColors]}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.processed_date ? new Date(record.processed_date).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PayrollFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddPayroll}
        employeeCount={employees.length}
      />
    </div>
  )
}
