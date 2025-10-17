"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Calendar } from "lucide-react"
import { LeaveFormDialog } from "./leave-form-dialog"
import { api } from "@/lib/api"

const statusColors = {
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const typeColors = {
  vacation: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  sick: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  personal: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
}

interface LeaveRequest {
  id: number
  employee: number
  employee_name: string
  type: string
  start_date: string
  end_date: string
  days: number
  status: string
  reason: string
  created_at: string
}

interface LeaveRequestsResponse {
  count: number
  next: string | null
  previous: string | null
  results: LeaveRequest[]
}

export function LeaveTab() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLeaveRequests()
    loadEmployees()
  }, [])

  const loadLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await api.leaveRequests.list() as LeaveRequestsResponse
      setLeaveRequests(response.results || [])
    } catch (err: any) {
      setError(err.message || "Failed to load leave requests")
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

  const handleAddLeave = async (leaveData: any) => {
    try {
      const newLeave = await api.leaveRequests.create(leaveData) as LeaveRequest
      setLeaveRequests([newLeave, ...leaveRequests])
    } catch (err: any) {
      setError(err.message || "Failed to add leave request")
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await api.leaveRequests.update(id.toString(), { status: "approved" })
      setLeaveRequests(leaveRequests.map((req) => (req.id === id ? { ...req, status: "approved" } : req)))
    } catch (err: any) {
      setError(err.message || "Failed to approve leave request")
    }
  }

  const handleReject = async (id: number) => {
    try {
      await api.leaveRequests.update(id.toString(), { status: "rejected" })
      setLeaveRequests(leaveRequests.map((req) => (req.id === id ? { ...req, status: "rejected" } : req)))
    } catch (err: any) {
      setError(err.message || "Failed to reject leave request")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Leave Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Manage employee leave and time off</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employee_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[request.type as keyof typeof typeColors]}>
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(request.start_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(request.end_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{request.days} days</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[request.status as keyof typeof statusColors]}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeaveFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} onSubmit={handleAddLeave} employees={employees} />
    </div>
  )
}
