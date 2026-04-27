"use client"

import { ExpenseDataTable } from "@/components/finance/expense-data-table"
import { Expense, ExpenseStats, OperationStats, Project } from "@/lib/project-types"

interface ProjectExpensesTabProps {
  project: Project
  expenses: Expense[]
  expenseStats: ExpenseStats
  operationStats: OperationStats
  onAdd: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
  onViewDetail: (expense: Expense) => void
}

export function ProjectExpensesTab({
  project,
  expenses,
  expenseStats,
  operationStats,
  onAdd,
  onEdit,
  onDelete,
  onViewDetail,
}: ProjectExpensesTabProps) {
  return (
    <ExpenseDataTable
      mode="project"
      expenses={expenses}
      project={project}
      expenseStats={expenseStats}
      operationStats={operationStats}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewDetail={onViewDetail}
    />
  )
}
