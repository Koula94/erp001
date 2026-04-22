"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_OPTIONS, getCategoryName, SUBCATEGORY_EXAMPLES } from "@/lib/categories"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
  projectId?: string
  projectName?: string
}

export function ExpenseFormDialog({ open, onOpenChange, onSubmit, initialData, projectId, projectName }: ExpenseFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      description: "",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      project: "",
      status: "draft",
      notes: "",
    },
  )
  
  interface SubcategoryItem {
    id: string
    name: string
    amount: number
  }
  
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>(() => {
    if (initialData?.subcategory) {
      // Si la sous-catégorie contient des virgules, on la sépare en plusieurs éléments
      if (initialData.subcategory.includes(',')) {
        const names = initialData.subcategory
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
        
        // Créer des objets SubcategoryItem avec des montants par défaut
        return names.map((name: string, index: number) => ({
          id: `subcat-${Date.now()}-${index}`,
          name,
          amount: 0
        }))
      }
      // Sinon, on retourne un tableau avec un seul élément
      return [{
        id: `subcat-${Date.now()}-0`,
        name: initialData.subcategory,
        amount: 0
      }]
    }
    return []
  })
  
  const [newSubcategory, setNewSubcategory] = useState("")
  const [newSubcategoryAmount, setNewSubcategoryAmount] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Calculer le montant total automatiquement
  const totalAmount = subcategories.reduce((sum, item) => sum + item.amount, 0)
  
  // Suggestions de sous-catégories basées sur la catégorie sélectionnée
  const suggestedSubcategories = useMemo(() => {
    if (!formData.category) return []
    return SUBCATEGORY_EXAMPLES[formData.category as keyof typeof SUBCATEGORY_EXAMPLES] || []
  }, [formData.category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation des sous-catégories
    const hasInvalidAmount = subcategories.some(item => item.amount <= 0)
    if (hasInvalidAmount) {
      alert("❌ Tous les montants des sous-catégories doivent être positifs!")
      return
    }
    
    // Déterminer la valeur du projet
    let projectValue = null
    if (projectId) {
      // Si un projectId est fourni, l'utiliser
      projectValue = parseInt(projectId) || null
    } else if (formData.project && formData.project.trim() !== '') {
      // Sinon, utiliser la valeur du formulaire si elle n'est pas vide
      projectValue = parseInt(formData.project) || null
    }
    
    // Préparer les données pour la soumission avec structure JSON améliorée
    const submissionData = {
      ...formData,
      amount: totalAmount > 0 ? totalAmount : formData.amount,
      project: projectValue,
      // Structure JSON pour les sous-catégories (au lieu d'une simple chaîne)
      subcategories: subcategories.length > 0 ? subcategories.map(item => ({
        name: item.name,
        amount: item.amount
      })) : [],
      // Rétrocompatibilité: garder aussi le champ subcategory comme chaîne
      subcategory: subcategories.map(item => item.name).join(', ') || ''
    }
    
    onSubmit(submissionData)
    onOpenChange(false)
  }
  
  // Mettre à jour automatiquement le montant quand les sous-catégories changent
  useEffect(() => {
    if (totalAmount > 0) {
      setFormData((prev: any) => ({ ...prev, amount: totalAmount }))
    }
  }, [totalAmount])
  
  const handleAddSubcategory = () => {
    if (!newSubcategory.trim() || !newSubcategoryAmount) {
      alert("❌ Veuillez remplir le nom et le montant de la sous-catégorie")
      return
    }
    
    // Validation: Pas de doublons
    const exists = subcategories.some(sc => 
      sc.name.toLowerCase() === newSubcategory.trim().toLowerCase()
    )
    if (exists) {
      alert("⚠️ Cette sous-catégorie existe déjà!")
      return
    }
    
    // Validation: Montant positif
    const amount = parseFloat(newSubcategoryAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("❌ Le montant doit être un nombre positif!")
      return
    }
    
    const newItem: SubcategoryItem = {
      id: `subcat-${Date.now()}-${subcategories.length}`,
      name: newSubcategory.trim(),
      amount: amount
    }
    setSubcategories([...subcategories, newItem])
    setNewSubcategory("")
    setNewSubcategoryAmount("")
    setShowSuggestions(false)
  }
  
  const handleAddSuggestedSubcategory = (suggestion: string) => {
    setNewSubcategory(suggestion)
    setShowSuggestions(false)
    // Focus sur le champ montant
    setTimeout(() => {
      const amountInput = document.querySelector('input[placeholder="Montant ($)"]') as HTMLInputElement
      if (amountInput) amountInput.focus()
    }, 100)
  }
  
  const handleRemoveSubcategory = (index: number) => {
    const updated = [...subcategories]
    updated.splice(index, 1)
    setSubcategories(updated)
  }
  
  const handleUpdateSubcategoryAmount = (index: number, amount: number) => {
    // Validation: Montant positif
    if (amount < 0) {
      alert("❌ Le montant ne peut pas être négatif!")
      return
    }
    
    const updated = [...subcategories]
    updated[index] = { ...updated[index], amount }
    setSubcategories(updated)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubcategory.trim() && newSubcategoryAmount) {
      e.preventDefault()
      handleAddSubcategory()
    }
  }
  
  const handleReorderSubcategory = (fromIndex: number, toIndex: number) => {
    const updated = [...subcategories]
    const [movedItem] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedItem)
    setSubcategories(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {initialData ? "Modifier la dépense" : "Nouvelle Dépense"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {initialData ? "Mettre à jour les informations de la dépense" : "Enregistrer une nouvelle dépense de projet"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-5 py-4 overflow-y-auto flex-1 pr-2">
            {/* Section 1: Informations de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Informations de base
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-medium">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Ex: Achat de matériaux pour le chantier"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-medium">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-medium">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Montant et sous-catégories */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Montant et détails
              </h3>
              
              <div className="space-y-4">
                {/* Montant principal */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-medium">Montant total ($) *</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={totalAmount > 0 ? totalAmount : formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      required
                      placeholder="0.00"
                      className="h-10 pl-8"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      $
                    </div>
                  </div>
                  {subcategories.length > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Calculé automatiquement à partir des sous-catégories
                    </p>
                  )}
                </div>
                
                {/* Sous-catégories simplifiées */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Sous-catégories (optionnel)</Label>
                    {subcategories.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {subcategories.length} élément{subcategories.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Suggestions rapides */}
                  {formData.category && suggestedSubcategories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Suggestions rapides</Label>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSubcategories.slice(0, 5).map((suggestion, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                            onClick={() => handleAddSuggestedSubcategory(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Liste simple des sous-catégories */}
                  {subcategories.length > 0 && (
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                      {subcategories.map((subcat, index) => (
                        <div key={subcat.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                            <span className="text-sm">{subcat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={subcat.amount}
                              onChange={(e) => handleUpdateSubcategoryAmount(index, parseFloat(e.target.value) || 0)}
                              className="h-8 w-24 text-right"
                              placeholder="0.00"
                            />
                            <span className="text-sm font-medium">$</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSubcategory(index)}
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Supprimer"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Ajout de sous-catégorie */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-subcategory" className="text-sm">
                          Nom de la sous-catégorie
                        </Label>
                        <Input
                          id="new-subcategory"
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ex: Bois, Ciment..."
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-amount" className="text-sm">
                          Montant ($)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="new-amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={newSubcategoryAmount}
                            onChange={(e) => setNewSubcategoryAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-9 flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSubcategory}
                            disabled={!newSubcategory.trim() || !newSubcategoryAmount}
                            className="h-9 px-3"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      💡 Ajoutez des sous-catégories pour un suivi détaillé. Le total est automatiquement calculé.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Informations supplémentaires */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Informations supplémentaires
              </h3>
              
              <div className="space-y-4">
                {/* Projet */}
                <div className="space-y-2">
                  <Label htmlFor="project" className="font-medium">Projet associé</Label>
                  {projectName ? (
                    <div className="space-y-1">
                      <Input
                        id="project"
                        value={projectName}
                        readOnly
                        className="h-10 bg-muted"
                      />
                      <Input
                        type="hidden"
                        value={projectId}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Projet associé automatiquement</p>
                    </div>
                  ) : (
                    <>
                      <Input
                        id="project"
                        value={formData.project}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        placeholder="ID du projet associé"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">Laissez vide si pas de projet associé</p>
                    </>
                  )}
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-medium">Notes internes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes pour le traitement de la dépense"
                    rows={3}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{initialData ? "Mettre à jour" : "Enregistrer"} la dépense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
