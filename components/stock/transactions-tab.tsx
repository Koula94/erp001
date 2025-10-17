"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { stockTransactions } from "@/lib/mock-data"
import { useState } from "react"
import { TransactionFormDialog } from "./transaction-form-dialog"

const typeColors = {
  in: "bg-green-500/10 text-green-700 dark:text-green-400",
  out: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

export function TransactionsTab() {
  const [transactionsData, setTransactionsData] = useState(stockTransactions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddTransaction = (data: any) => {
    const newTransaction = {
      ...data,
      id: `TXN-${String(transactionsData.length + 1).padStart(4, "0")}`,
      date: new Date().toISOString(),
    }
    setTransactionsData([newTransaction, ...transactionsData])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Transactions</CardTitle>
          <CardDescription>Track all inventory movements and allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsData.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColors[transaction.type]}>
                      <div className="flex items-center gap-1">
                        {transaction.type === "in" ? (
                          <ArrowDownCircle className="h-3 w-3" />
                        ) : (
                          <ArrowUpCircle className="h-3 w-3" />
                        )}
                        {transaction.type}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.materialName}</TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{transaction.reference}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{transaction.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleAddTransaction} />
    </div>
  )
}
