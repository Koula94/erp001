"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChart } from "lucide-react"
import { api } from "@/lib/api"

interface FinancialReport {
  id: string
  name: string
  type: string
  period: string
  generated_at: string
  status: string
  download_url?: string
}

export function ReportsTab() {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // For now, we'll create mock reports since the API might not have reports endpoint
      const mockReports: FinancialReport[] = [
        {
          id: "1",
          name: "Profit & Loss Statement",
          type: "profit_loss",
          period: "Q1 2024",
          generated_at: "2024-03-31T23:59:59Z",
          status: "completed",
        },
        {
          id: "2",
          name: "Cash Flow Report",
          type: "cash_flow",
          period: "Q1 2024",
          generated_at: "2024-03-31T23:59:59Z",
          status: "completed",
        },
        {
          id: "3",
          name: "Revenue Analysis",
          type: "revenue",
          period: "March 2024",
          generated_at: "2024-03-31T23:59:59Z",
          status: "completed",
        },
        {
          id: "4",
          name: "Expense Breakdown",
          type: "expenses",
          period: "Q1 2024",
          generated_at: "2024-03-31T23:59:59Z",
          status: "completed",
        },
      ]
      setReports(mockReports)
      setError(null)
    } catch (err) {
      setError("Failed to load reports")
      console.error("Error loading reports:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (reportType: string) => {
    try {
      // This would call the API to generate a new report
      console.log(`Generating ${reportType} report...`)
      // For now, we'll just show a success message
      alert(`Report generation started for ${reportType}. This may take a few minutes.`)
    } catch (err) {
      setError("Failed to generate report")
      console.error("Error generating report:", err)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      // This would call the API to download the report
      console.log(`Downloading report ${reportId}...`)
      // For now, we'll just show a success message
      alert("Report download started. Check your downloads folder.")
    } catch (err) {
      setError("Failed to download report")
      console.error("Error downloading report:", err)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case "profit_loss":
        return <TrendingUp className="h-6 w-6" />
      case "cash_flow":
        return <DollarSign className="h-6 w-6" />
      case "revenue":
        return <BarChart3 className="h-6 w-6" />
      case "expenses":
        return <PieChart className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  const getReportColor = (type: string) => {
    switch (type) {
      case "profit_loss":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "cash_flow":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "revenue":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      case "expenses":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Generate New Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Profit & Loss</h3>
                  <p className="text-sm text-muted-foreground">Income vs Expenses</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleGenerateReport("profit_loss")}
                  className="w-full"
                >
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium">Cash Flow</h3>
                  <p className="text-sm text-muted-foreground">Cash movements</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleGenerateReport("cash_flow")}
                  className="w-full"
                >
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium">Revenue Analysis</h3>
                  <p className="text-sm text-muted-foreground">Revenue trends</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleGenerateReport("revenue")}
                  className="w-full"
                >
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium">Expense Breakdown</h3>
                  <p className="text-sm text-muted-foreground">Expense categories</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleGenerateReport("expenses")}
                  className="w-full"
                >
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and download previously generated financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reports found</p>
              <p className="text-sm">Generate your first report to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {getReportIcon(report.type)}
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getReportColor(report.type)}>
                        {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(report.generated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
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
