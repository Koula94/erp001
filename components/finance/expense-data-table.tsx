"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Plus, Pencil, Trash2, Eye, Filter, X, Search, FileText, Loader2, Paperclip, Receipt } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CATEGORY_OPTIONS } from "@/lib/categories"
import { categoryLabels, priorityLabels, priorityColors, formatAmount, formatDate } from "@/lib/expense-utils"
import { Expense, ExpenseStats, OperationStats, Project } from "@/lib/project-types"

interface ExpenseDataTableProps {
  mode: "global" | "project"
  expenses: Expense[]
  projects?: Array<{ id: string; name: string }>
  project?: Project
  expenseStats?: ExpenseStats
  operationStats?: OperationStats
  loading?: boolean
  onAdd: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
  onViewDetail: (expense: Expense) => void
}

export function ExpenseDataTable({
  mode,
  expenses,
  projects = [],
  project,
  expenseStats,
  operationStats,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onViewDetail,
}: ExpenseDataTableProps) {
  const isProject = mode === "project"

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = !searchQuery || (expense.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    const matchesProject = !isProject || projectFilter === "all" || expense.project?.id === projectFilter
    const matchesDateFrom = !dateFrom || new Date(expense.date) >= dateFrom
    const matchesDateTo = !dateTo || new Date(expense.date) <= dateTo
    return matchesSearch && matchesCategory && matchesProject && matchesDateFrom && matchesDateTo
  })

  const hasActiveFilters = categoryFilter !== "all" || projectFilter !== "all" || dateFrom !== undefined || dateTo !== undefined || !!searchQuery

  const clearFilters = () => {
    setCategoryFilter("all")
    setProjectFilter("all")
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearchQuery("")
  }

  return (
    <div className="space-y-6">
      {/* Statistiques (mode projet uniquement) */}
      {isProject && expenseStats && operationStats && project && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">💰 Dépenses Effectuées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(expenseStats.total_caisse_operations)}</p>
              <p className="text-xs text-muted-foreground mt-1">{expenseStats.total_count} dépenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">🏦 Caisse Disponible</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatAmount(Math.max(0, operationStats.total_paye - expenseStats.total_caisse_operations))}</p>
              <p className="text-xs text-muted-foreground mt-1">Opérations payées: {formatAmount(operationStats.total_paye)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">📊 Utilisation Caisse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {operationStats.total_paye > 0 ? `${((expenseStats.total_caisse_operations / operationStats.total_paye) * 100).toFixed(1)}%` : "0%"}
              </p>
              <Progress value={operationStats.total_paye > 0 ? (expenseStats.total_caisse_operations / operationStats.total_paye) * 100 : 0} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">📋 Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>Budget projet: <strong>{formatAmount(project.budget)}</strong></p>
                <p>Opérations payées: <strong>{formatAmount(operationStats.total_paye)}</strong></p>
                <p>Dépenses caisse: <strong>{formatAmount(expenseStats.total_caisse_operations)}</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{isProject ? "Dépenses du Projet" : "Dépenses"}</CardTitle>
              <CardDescription>{isProject ? "Gérez les dépenses associées à ce projet" : "Gérez les dépenses de projet"}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 w-48" />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={showFilters ? "bg-primary/10" : ""}>
                <Filter className="h-4 w-4" />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive">
                  <X className="h-4 w-4 mr-1" />{isProject ? "Réinit." : "Réinitialiser"}
                </Button>
              )}
              <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Nouvelle</Button>
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="all">Toutes les catégories</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              {!isProject && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Projet</label>
                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="all">Tous les projets</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de début</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: fr }) : <span className="text-muted-foreground">Choisir...</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de fin</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: fr }) : <span className="text-muted-foreground">Choisir...</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Badges de filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-sm text-muted-foreground">
              <span>Filtres:</span>
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategoryFilter("all")}>
                  Catégorie: {categoryLabels[categoryFilter] || categoryFilter} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {!isProject && projectFilter !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setProjectFilter("all")}>
                  Projet: {projects.find(p => p.id === projectFilter)?.name || projectFilter} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {!isProject && dateFrom && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setDateFrom(undefined)}>
                  Du: {format(dateFrom, "dd/MM/yyyy", { locale: fr })} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {!isProject && dateTo && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setDateTo(undefined)}>
                  Au: {format(dateTo, "dd/MM/yyyy", { locale: fr })} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              <span className="ml-auto">{filteredExpenses.length} résultat(s)</span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isProject ? <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" /> : <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />}
              <p>{hasActiveFilters ? "Aucune dépense ne correspond aux filtres" : isProject ? "Aucune dépense enregistrée pour ce projet" : "Aucune dépense enregistrée"}</p>
              <p className="text-sm">{hasActiveFilters ? "Essayez de modifier vos critères de recherche" : "Créez votre première dépense pour commencer"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sous-catégorie</TableHead>
                  <TableHead>Montant</TableHead>
                  {isProject && <TableHead>Priorité</TableHead>}
                  <TableHead>Date</TableHead>
                  {!isProject && <TableHead>Projet</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onViewDetail(expense)}>
                     <TableCell className="font-medium max-w-xs">
                       <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                           <span className="truncate">{expense.description}</span>
                           
                         </div>
                         {expense.notes && <span className="text-xs text-muted-foreground mt-1">{expense.notes}</span>}
                       </div>
                     </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700">{categoryLabels[expense.category] || expense.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {expense.subcategory?.trim() ? (
                        <span className="text-sm text-muted-foreground">{expense.subcategory}</span>
                      ) : expense.subcategories?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {expense.subcategories.map((sc, idx) => (
                            <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-700 text-xs">{sc.name}</Badge>
                          ))}
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">Aucune</span>}
                    </TableCell>
                    <TableCell className="font-semibold">{formatAmount(expense.amount)}</TableCell>
                    {isProject && (
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[expense.priority] || priorityColors.medium}>
                          {priorityLabels[expense.priority] || expense.priority}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    {!isProject && (
                      <TableCell><Badge variant="secondary">{expense.project?.name || "Sans projet"}</Badge></TableCell>
                    )}
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          {/* Bouton de reçu (si disponible) */}
                          {/* Ajoute un hover effect */}
                        <button onClick={(e) => {
                          e.stopPropagation()
                          if (expense.receipt_url) {
                            window.open(expense.receipt_url, "_blank")
                          }
                          }} 

                          title={expense.receipt_url ? "Voir le reçu" : "Aucun reçu"} disabled={!expense.receipt_url}
                          className={`p-1 rounded ${expense.receipt_url ? "hover:bg-green-500/20" : "cursor-not-allowed opacity-50"}`}>
                            <Paperclip className={`h-4 w-4 ${expense.receipt_url ? "text-green-600" : "text-muted-foreground"}`} />
                          </button>
                      
                      
                      
                         <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewDetail(expense) }} title="Voir les détails"><Eye className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(expense) }} title="Modifier"><Pencil className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(expense.id) }} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                       </div>
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
