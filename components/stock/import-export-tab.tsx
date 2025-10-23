"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import * as XLSX from "xlsx"

interface ImportResult {
  success: number
  errors: number
  details: string[]
}

export function ImportExportTab() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const exportMaterials = async () => {
    try {
      setExporting(true)
      const response = await api.materials.list() as any
      const materials = Array.isArray(response) ? response : response?.results || response?.data || []

      const wb = XLSX.utils.book_new()
      const materialsData = [
        ['Sofixe ERP - Materials Export'],
        ['Generated:', new Date().toISOString().split('T')[0]],
        [],
        ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Max Stock', 'Unit Price', 'Location', 'Supplier', 'Last Restocked', 'Status']
      ]

      materials.forEach((mat: any) => {
        materialsData.push([
          mat.name,
          mat.category,
          mat.quantity,
          mat.unit,
          mat.min_stock,
          mat.max_stock,
          mat.unit_price,
          mat.location,
          mat.supplier,
          mat.last_restocked,
          mat.status
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(materialsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Materials')
      XLSX.writeFile(wb, `materials-export-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting materials:", error)
      alert("Error exporting materials. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const exportEquipment = async () => {
    try {
      setExporting(true)
      const response = await api.equipment.list() as any
      const equipment = Array.isArray(response) ? response : response?.results || response?.data || []

      const wb = XLSX.utils.book_new()
      const equipmentData = [
        ['Sofixe ERP - Equipment Export'],
        ['Generated:', new Date().toISOString().split('T')[0]],
        [],
        ['Name', 'Category', 'Status', 'Condition', 'Location', 'Value', 'Purchase Date', 'Last Maintenance', 'Next Maintenance']
      ]

      equipment.forEach((eq: any) => {
        equipmentData.push([
          eq.name,
          eq.category,
          eq.status,
          eq.condition,
          eq.location,
          eq.value,
          eq.purchase_date,
          eq.last_maintenance,
          eq.next_maintenance
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(equipmentData)
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment')
      XLSX.writeFile(wb, `equipment-export-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting equipment:", error)
      alert("Error exporting equipment. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const exportTransactions = async () => {
    try {
      setExporting(true)
      const response = await api.stockTransactions.list() as any
      const transactions = Array.isArray(response) ? response : response?.results || response?.data || []

      const wb = XLSX.utils.book_new()
      const transactionsData = [
        ['Sofixe ERP - Transactions Export'],
        ['Generated:', new Date().toISOString().split('T')[0]],
        [],
        ['Date', 'Type', 'Material Name', 'Quantity', 'Reference', 'Notes']
      ]

      transactions.forEach((trans: any) => {
        transactionsData.push([
          new Date(trans.date).toISOString().split('T')[0],
          trans.type,
          trans.material?.name || 'Unknown',
          trans.quantity,
          trans.reference,
          trans.notes || ''
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(transactionsData)
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
      XLSX.writeFile(wb, `transactions-export-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error exporting transactions:", error)
      alert("Error exporting transactions. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'materials' | 'equipment') => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setImportResult(null)

      let data: any[] = []
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (fileExtension === 'xlsx') {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        const headers = jsonData[0] as string[]
        data = jsonData.slice(1).filter((row: any) => row.some((cell: any) => cell !== null && cell !== ''))
          .map((row: any) => {
            const item: any = {}
            headers.forEach((header, index) => {
              if (header && row[index] !== undefined) {
                item[header.toLowerCase().replace(' ', '_')] = row[index]
              }
            })
            return item
          })
      } else {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error("File is empty or has no data")
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim())
          const row: any = {}
          headers.forEach((header, index) => {
            row[header.toLowerCase().replace(' ', '_')] = values[index] || ''
          })
          return row
        })
      }

      let successCount = 0
      let errorCount = 0
      const details: string[] = []

      for (const item of data) {
        try {
          if (type === 'materials') {
            if (!item.name || !item.category || !item.unit || !item.last_restocked) {
              throw new Error("Missing required fields: name, category, unit, or last_restocked")
            }

            const apiData = {
              name: item.name,
              category: item.category,
              quantity: parseInt(item.quantity) || 0,
              unit: item.unit,
              min_stock: parseInt(item.min_stock) || 0,
              max_stock: parseInt(item.max_stock) || 0,
              unit_price: parseFloat(item.unit_price) || 0,
              location: item.location || 'Default',
              supplier: item.supplier || 'Unknown',
              last_restocked: item.last_restocked || new Date().toISOString().split('T')[0],
              status: item.status || 'in-stock'
            }

            await api.materials.create(apiData)
            successCount++
            details.push(`✓ ${item.name} - Imported successfully`)
          } else if (type === 'equipment') {
            if (!item.name || !item.category) {
              throw new Error("Missing required fields: name or category")
            }

            const apiData = {
              name: item.name,
              category: item.category,
              status: item.status || 'available',
              condition: item.condition || 'good',
              location: item.location || 'Default',
              value: parseFloat(item.value) || 0,
              purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
              last_maintenance: item.last_maintenance || new Date().toISOString().split('T')[0],
              next_maintenance: item.next_maintenance || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }

            await api.equipment.create(apiData)
            successCount++
            details.push(`✓ ${item.name} - Imported successfully`)
          }
        } catch (error: any) {
          errorCount++
          const itemName = item.name || 'Unknown item'
          details.push(`✗ ${itemName} - ${error.message || 'Import failed'}`)
        }
      }

      setImportResult({
        success: successCount,
        errors: errorCount,
        details
      })

      event.target.value = ''

    } catch (error: any) {
      console.error("Error importing file:", error)
      alert(`Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (type: 'materials' | 'equipment') => {
    const wb = XLSX.utils.book_new()
    
    if (type === 'materials') {
      const data = [
        ['Sofixe ERP - Materials Import Template'],
        ['Instructions: Fill in the data below. Required fields: Name, Category, Unit, Last Restocked'],
        [],
        ['Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Max Stock', 'Unit Price', 'Location', 'Supplier', 'Last Restocked', 'Status'],
        ['Ciment', 'Construction', '100', 'kg', '10', '200', '15.50', 'Entrepôt A', 'Fournisseur XYZ', '2024-10-18', 'in-stock']
      ]
      
      const ws = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Materials Data')
    } else {
      const data = [
        ['Sofixe ERP - Equipment Import Template'],
        ['Instructions: Fill in the data below. Required fields: Name, Category'],
        [],
        ['Name', 'Category', 'Status', 'Condition', 'Location', 'Value', 'Purchase Date', 'Last Maintenance', 'Next Maintenance'],
        ['Excavatrice', 'Machinerie', 'available', 'good', 'Chantier B', '50000', '2024-01-15', '2024-06-20', '2024-12-20']
      ]
      
      const ws = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment Data')
    }

    XLSX.writeFile(wb, `${type}-import-template.xlsx`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Export your stock data to XLSX format for external analysis or backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium">Materials</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export all materials with quantities, prices, and stock levels
              </p>
              <Button onClick={exportMaterials} disabled={exporting} className="w-full">
                {exporting ? "Exporting..." : "Export Materials"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h3 className="font-medium">Equipment</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export equipment inventory with status, condition, and maintenance dates
              </p>
              <Button onClick={exportEquipment} disabled={exporting} className="w-full">
                {exporting ? "Exporting..." : "Export Equipment"}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium">Transactions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Export stock movement history with dates, quantities, and references
              </p>
              <Button onClick={exportTransactions} disabled={exporting} className="w-full">
                {exporting ? "Exporting..." : "Export Transactions"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import materials or equipment from XLSX or CSV files. Download templates first to ensure proper formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Import Materials</h3>
                <Button variant="outline" size="sm" onClick={() => downloadTemplate('materials')}>
                  Download Template
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Required fields: Name, Category, Unit, Last Restocked
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => handleFileImport(e, 'materials')}
                    disabled={importing}
                    className="hidden"
                    id="materials-import"
                  />
                  <label htmlFor="materials-import" className="cursor-pointer block">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {importing ? "Importing..." : "Choose File"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      XLSX or CSV format
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Import Equipment</h3>
                <Button variant="outline" size="sm" onClick={() => downloadTemplate('equipment')}>
                  Download Template
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Required fields: Name, Category
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => handleFileImport(e, 'equipment')}
                    disabled={importing}
                    className="hidden"
                    id="equipment-import"
                  />
                  <label htmlFor="equipment-import" className="cursor-pointer block">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {importing ? "Importing..." : "Choose File"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      XLSX or CSV format
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {importResult && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Import Results</h3>
                <Badge 
                  variant={importResult.errors === 0 ? "default" : "destructive"}
                  className={
                    importResult.errors === 0 
                      ? "bg-green-500/10 text-green-700" 
                      : "bg-red-500/10 text-red-700"
                  }
                >
                  {importResult.success} Success, {importResult.errors} Errors
                </Badge>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1">
                {importResult.details.map((detail, index) => (
                  <div 
                    key={index} 
                    className={`text-sm flex items-center gap-2 ${
                      detail.startsWith('✓') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {detail.startsWith('✓') ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
