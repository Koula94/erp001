"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, AlertTriangle, Package, TrendingUp, Calendar } from "lucide-react"
import { api } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReportData {
  lowStockMaterials: any[]
  recentTransactions: any[]
  stockSummary: {
    totalMaterials: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
    totalTransactions: number
  }
}

export function ReportsTab() {
  const [reportData, setReportData] = useState<ReportData>({
    lowStockMaterials: [],
    recentTransactions: [],
    stockSummary: {
      totalMaterials: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalTransactions: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  })

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Load materials and transactions
      const [materialsResponse, transactionsResponse] = await Promise.all([
        api.materials.list() as any,
        api.stockTransactions.list() as any
      ])

      const materials = Array.isArray(materialsResponse) ? materialsResponse : 
                       materialsResponse?.results || materialsResponse?.data || []
      
      const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : 
                          transactionsResponse?.results || transactionsResponse?.data || []

      // Filter transactions by date range
      const filteredTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0]
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end
      })

      // Calculate summary
      const totalValue = materials.reduce((sum: number, mat: any) => {
        const quantity = mat.quantity || 0
        const unitPrice = mat.unit_price || 0
        return sum + (quantity * unitPrice)
      }, 0)
      const lowStockCount = materials.filter((mat: any) => mat.status === 'low-stock').length
      const outOfStockCount = materials.filter((mat: any) => mat.status === 'out-of-stock').length

      // Get low stock materials
      const lowStockMaterials = materials
        .filter((mat: any) => mat.status === 'low-stock' || mat.status === 'out-of-stock')
        .sort((a: any, b: any) => a.quantity - b.quantity)

      setReportData({
        lowStockMaterials,
        recentTransactions: filteredTransactions.slice(0, 10), // Last 10 transactions
        stockSummary: {
          totalMaterials: materials.length,
          totalValue,
          lowStockCount,
          outOfStockCount,
          totalTransactions: filteredTransactions.length
        }
      })
    } catch (error) {
      console.error("Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateCSVReport = () => {
    // Generate CSV content for low stock materials
    const headers = ['Material', 'Category', 'Quantity', 'Min Stock', 'Max Stock', 'Status', 'Location']
    const csvContent = [
      headers.join(','),
      ...reportData.lowStockMaterials.map((mat: any) => [
        `"${mat.name}"`,
        `"${mat.category}"`,
        mat.quantity,
        mat.minStock,
        mat.maxStock,
        mat.status,
        `"${mat.location}"`
      ].join(','))
    ].join('\n')

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const generateTransactionReport = () => {
    // Generate CSV content for transactions
    const headers = ['Date', 'Type', 'Material', 'Quantity', 'Reference', 'Notes']
    const csvContent = [
      headers.join(','),
      ...reportData.recentTransactions.map((trans: any) => [
        new Date(trans.date).toLocaleDateString(),
        trans.type,
        `"${trans.material?.name || 'Unknown'}"`,
        trans.quantity,
        `"${trans.reference}"`,
        `"${trans.notes || ''}"`
      ].join(','))
    ].join('\n')

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-report-${dateRange.start}-to-${dateRange.end}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Select date range for transaction reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.stockSummary.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">Material types in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportData.stockSummary.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.stockSummary.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Materials need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.stockSummary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Low Stock Alert Report</CardTitle>
            <CardDescription>Materials that need immediate attention</CardDescription>
          </div>
          <Button onClick={generateCSVReport} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {reportData.lowStockMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No low stock materials found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Stock Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.lowStockMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>
                      {material.quantity} {material.unit}
                    </TableCell>
                    <TableCell>
                      {material.minStock} - {material.maxStock} {material.unit}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          material.status === 'out-of-stock' 
                            ? "bg-red-500/10 text-red-700" 
                            : "bg-yellow-500/10 text-yellow-700"
                        }
                      >
                        {material.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{material.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest stock movements in selected period</CardDescription>
          </div>
          <Button onClick={generateTransactionReport} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {reportData.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found in selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          transaction.type === 'in' 
                            ? "bg-green-500/10 text-green-700" 
                            : "bg-blue-500/10 text-blue-700"
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.material?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {transaction.quantity} {transaction.material?.unit || ''}
                    </TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
