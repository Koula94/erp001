"use client"

import type React from "react"

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

interface OperationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: any
  projectId?: string
  projectName?: string
}

interface SubcategoryItem {
  id: string
  name: string
  amount: number
}

export function OperationFormDialog({ open, onOpenChange, onSubmit, initialData, projectId, projectName }: OperationFormDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      task_name: "",
      project: projectId || "",
      period: "one_time",
      total_amount: 0,
      description: "",
      status: "draft",
      category: "",
      subcategory: "",
    },
  )
  
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
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    // Initialiser avec la catégorie existante si elle existe
    if (initialData?.category) {
      // Si c'est une chaîne simple, la convertir en tableau
      if (typeof initialData.category === 'string') {
        return [initialData.category]
      }
      // Si c'est déjà un tableau, le retourner
      if (Array.isArray(initialData.category)) {
        return initialData.category
      }
    }
    return []
  })
  
  // État pour les informations du projet (budget)
  const [projectInfo, setProjectInfo] = useState<{budget: number, spent: number} | null>(null)
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null)
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [showSubcategorySuggestions, setShowSubcategorySuggestions] = useState(false)
  
  // Suggestions de sous-catégories basées sur les catégories sélectionnées
  const suggestedSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) return []
    
    // Récupérer les suggestions pour chaque catégorie sélectionnée
    const suggestions: string[] = []
    selectedCategories.forEach(category => {
      const categorySuggestions = SUBCATEGORY_EXAMPLES[category as keyof typeof SUBCATEGORY_EXAMPLES] || []
      suggestions.push(...categorySuggestions)
    })
    
    // Éliminer les doublons
    return [...new Set(suggestions)]
  }, [selectedCategories])
  
  // Fonction pour ajouter une sous-catégorie suggérée
  const handleAddSuggestedSubcategory = (suggestion: string) => {
    setNewSubcategory(suggestion)
    setShowSubcategorySuggestions(false)
    // Focus sur le champ montant
    setTimeout(() => {
      const amountInput = document.querySelector('input[placeholder="Montant (GNF)"]') as HTMLInputElement
      if (amountInput) amountInput.focus()
    }, 100)
  }
  
  // Fonction améliorée pour ajouter une sous-catégorie
  const handleAddSubcategoryImproved = () => {
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
    setShowSubcategorySuggestions(false)
  }

  // Charger les tâches du projet
  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) {
        setTasks([])
        return
      }
      
      setLoadingTasks(true)
      try {
        // Appel API pour récupérer les tâches du projet
        console.log(`Chargement des tâches pour le projet: ${projectId}`)
        
        // Essayer plusieurs formats d'URL possibles
        const urlsToTry = [
          `/api/projects/tasks/?project=${projectId}`,
          `/api/projects/tasks?project=${projectId}`,
          `/api/tasks/?project=${projectId}`,
          `/api/tasks?project=${projectId}`
        ]
        
        let response = null
        let lastError = null
        
        for (const url of urlsToTry) {
          try {
            console.log(`Essai avec l'URL: ${url}`)
            response = await fetch(url, {
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include'
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log(`Tâches reçues via ${url}:`, data)
              setTasks(data)
              return // Sortir de la boucle si succès
            } else {
              console.log(`URL ${url} a retourné ${response.status}`)
              lastError = `Erreur ${response.status}: ${response.statusText}`
            }
          } catch (err) {
            console.log(`URL ${url} a échoué:`, err)
            lastError = err
          }
        }
        
        // Si aucune URL n'a fonctionné, c'est normal si l'API n'existe pas
        // Ne pas afficher d'erreur console pour éviter les erreurs 404
        console.log(`Aucune API de tâches disponible pour le projet ${projectId}. Utilisation du champ texte libre.`)
        setTasks([])
        
      } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error)
        setTasks([])
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchTasks()
  }, [projectId])

  // Reset form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      // Charger les sous-catégories si elles existent
      if (initialData.subcategory) {
        if (initialData.subcategory.includes(',')) {
          const names = initialData.subcategory
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
          
          setSubcategories(names.map((name: string, index: number) => ({
            id: `subcat-${Date.now()}-${index}`,
            name,
            amount: 0
          })))
        } else {
          setSubcategories([{
            id: `subcat-${Date.now()}-0`,
            name: initialData.subcategory,
            amount: 0
          }])
        }
      }
    } else {
      setFormData({
        task_name: "",
        project: projectId || "",
        period: "one_time",
        total_amount: 0,
        description: "",
        status: "draft",
        category: "",
        subcategory: "",
      })
      setSubcategories([])
    }
  }, [initialData, projectId])
  
  // Calculer le montant total automatiquement à partir des sous-catégories
  const totalAmountFromSubcategories = subcategories.reduce((sum, item) => sum + item.amount, 0)
  
  // Mettre à jour automatiquement le montant total
  useEffect(() => {
    if (totalAmountFromSubcategories > 0) {
      setFormData((prev: any) => ({ ...prev, total_amount: totalAmountFromSubcategories }))
    }
  }, [totalAmountFromSubcategories])

  // Fonctions pour gérer les sous-catégories
  const handleAddSubcategory = () => {
    if (newSubcategory.trim() && newSubcategoryAmount) {
      const amount = parseFloat(newSubcategoryAmount) || 0
      const newItem: SubcategoryItem = {
        id: `subcat-${Date.now()}-${subcategories.length}`,
        name: newSubcategory.trim(),
        amount: amount
      }
      setSubcategories([...subcategories, newItem])
      setNewSubcategory("")
      setNewSubcategoryAmount("")
    }
  }
  
  const handleRemoveSubcategory = (index: number) => {
    const updated = [...subcategories]
    updated.splice(index, 1)
    setSubcategories(updated)
  }
  
  const handleUpdateSubcategoryAmount = (index: number, amount: number) => {
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Préparer les données des sous-catégories pour l'API
    const subcategoriesForApi = subcategories.length > 0 
      ? subcategories.map(item => ({
          name: item.name,
          amount: item.amount
        }))
      : undefined
    
    // Pour la rétrocompatibilité, garder aussi le champ subcategory comme JSON
    const subcategoryData = subcategories.length > 0
      ? JSON.stringify(subcategoriesForApi)
      : formData.subcategory || ""
    
    // Préparer les catégories pour l'API
    // Si plusieurs catégories sélectionnées, les envoyer comme chaîne séparée par des virgules
    // Exemple: "materials,labor,equipment"
    const categoryForApi = selectedCategories.length > 0 
      ? selectedCategories.join(',') 
      : formData.category || ""
    
    // Préparer les données avec les sous-catégories et catégories multiples
    const submissionData = {
      ...formData,
      total_amount: totalAmountFromSubcategories > 0 ? totalAmountFromSubcategories : formData.total_amount,
      subcategory: subcategoryData,
      // Envoyer les catégories sélectionnées comme chaîne séparée par des virgules
      // L'API Django peut stocker cela directement dans la base de données
      category: categoryForApi,
      // Pour la compatibilité future, envoyer aussi le tableau
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      // Envoyer les sous-catégories dans le format attendu par l'API
      subcategories: subcategoriesForApi
    }
    
    console.log("Données soumises:", submissionData)
    console.log("Catégories envoyées:", categoryForApi)
    
    onSubmit(submissionData)
    onOpenChange(false)
  }

  // Check if the operation is in a read-only state
  // Seules les opérations en statut "draft" peuvent être modifiées
  // Une fois soumise, validée, payée ou rejetée, l'opération est en lecture seule
  const isReadOnly = initialData && initialData.status !== 'draft'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">
            {isReadOnly ? "Détails de la demande d'opération" : initialData ? "Modifier la demande d'opération" : "Nouvelle Demande d'Opération"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isReadOnly ? "Consultation des détails de la demande (lecture seule)" : initialData ? "Mettre à jour les informations de la demande" : "Créer une nouvelle demande d'opération financière"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-5 py-4 overflow-y-auto flex-1 pr-2">
            {/* Section 1: Informations principales */}
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-base font-semibold text-foreground">Informations principales</h3>
                <p className="text-sm text-muted-foreground mt-1">Détails de base de la demande d'opération</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task_name" className="font-medium">Tâche *</Label>
                  {projectId ? (
                    <>
                      {loadingTasks ? (
                        <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                          <span className="text-sm text-muted-foreground">Chargement des tâches...</span>
                        </div>
                      ) : tasks.length > 0 ? (
                        <Select
                          value={formData.task_name}
                          onValueChange={(value) => setFormData({ ...formData, task_name: value })}
                          disabled={isReadOnly}
                          required
                        >
                          <SelectTrigger className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}>
                            <SelectValue placeholder="Sélectionner une tâche" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Sélectionner une tâche --</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.title}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            id="task_name"
                            value={formData.task_name}
                            onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                            required
                            placeholder="Nom de la tâche ou opération"
                            readOnly={isReadOnly}
                            className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Aucune tâche disponible pour ce projet. Saisissez manuellement le nom de la tâche.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <Input
                      id="task_name"
                      value={formData.task_name}
                      onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                      required
                      placeholder="Nom de la tâche ou opération"
                      readOnly={isReadOnly}
                      className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project" className="font-medium">Projet</Label>
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
                          readOnly={isReadOnly}
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
                          readOnly={isReadOnly}
                          className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}
                        />
                        <p className="text-xs text-muted-foreground">Laissez vide si pas de projet associé</p>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period" className="font-medium">Période *</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData({ ...formData, period: value })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className={`h-10 ${isReadOnly ? "bg-muted" : ""}`}>
                        <SelectValue placeholder="Sélectionner une période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="quarterly">Trimestriel</SelectItem>
                        <SelectItem value="yearly">Annuel</SelectItem>
                        <SelectItem value="one_time">Ponctuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 2: Catégories budgétaires */}
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-base font-semibold text-foreground">Catégories budgétaires</h3>
                <p className="text-sm text-muted-foreground mt-1">Sélectionnez une ou plusieurs catégories pour cette opération</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_OPTIONS.map((category) => (
                    <div key={category.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`category-${category.value}`}
                        checked={selectedCategories.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.value])
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category.value))
                          }
                        }}
                        disabled={isReadOnly}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`category-${category.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                {selectedCategories.length > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-primary font-medium">
                        {selectedCategories.length} catégorie{selectedCategories.length > 1 ? 's' : ''} sélectionnée{selectedCategories.length > 1 ? 's' : ''}
                      </p>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {selectedCategories.length} sélectionné{selectedCategories.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-primary mt-1">
                      {selectedCategories.map(cat => getCategoryName(cat)).join(", ")}
                    </p>
                  </div>
                )}
                
                {/* Suggestions de sous-catégories */}
                {selectedCategories.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Suggestions de sous-catégories</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCategorySuggestions(!showCategorySuggestions)}
                        className="h-7 text-xs"
                      >
                        {showCategorySuggestions ? 'Masquer' : 'Afficher'}
                      </Button>
                    </div>
                    
                    {showCategorySuggestions && (
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <div className="space-y-3">
                          {selectedCategories.map(category => (
                            <div key={category} className="space-y-2">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <span>{CATEGORY_OPTIONS.find(c => c.value === category)?.icon}</span>
                                <span>{getCategoryName(category)}:</span>
                              </div>
                              <div className="flex flex-wrap gap-2 ml-4">
                                {(SUBCATEGORY_EXAMPLES[category as keyof typeof SUBCATEGORY_EXAMPLES] || []).map((suggestion, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                                    onClick={() => handleAddSuggestedSubcategory(suggestion)}
                                  >
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section Sous-catégories avec montants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="subcategory" className="text-base font-medium">Sous-catégories avec montants (optionnel)</Label>
                {subcategories.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {subcategories.length} sous-catégorie{subcategories.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
            
              
              {/* Formulaire d'ajout de sous-catégorie */}
              {!isReadOnly && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-3">Ajouter une sous-catégorie</h4>
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-7">
                      <Input
                        value={newSubcategory}
                        onChange={(e) => setNewSubcategory(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nom de la sous-catégorie"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={newSubcategoryAmount}
                        onChange={(e) => setNewSubcategoryAmount(e.target.value)}
                        placeholder="Montant (GNF)"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        onClick={handleAddSubcategory}
                        disabled={!newSubcategory.trim() || !newSubcategoryAmount}
                        className="h-9 w-full bg-primary hover:bg-primary/90"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Appuyez sur Entrée ou cliquez sur + pour ajouter la sous-catégorie
                  </p>
                </div>
              )}

               {/* Liste des sous-catégories */}
              {subcategories.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4 bg-card">
                  <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-7">Description</div>
                    <div className="col-span-4">Montant (GNF)</div>
                    <div className="col-span-1"></div>
                  </div>
                  {subcategories.map((subcat, index) => (
                    <div key={subcat.id} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-7">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                          <span className="text-sm">{subcat.name}</span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          step="0.01"
                          value={subcat.amount}
                          onChange={(e) => handleUpdateSubcategoryAmount(index, parseFloat(e.target.value) || 0)}
                          className="h-8"
                          placeholder="0.00"
                          readOnly={isReadOnly}
                        />
                      </div>
                      <div className="col-span-1">
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubcategory(index)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Total des sous-catégories */}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total des sous-catégories :</span>
                      <span className="text-lg font-bold text-primary">
                        {totalAmountFromSubcategories.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GNF
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Montant total et Statut */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Montant total demandé (GNF) *</Label>
                <div className="relative">
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmountFromSubcategories > 0 ? totalAmountFromSubcategories : formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                    required
                    placeholder="0.00"
                    readOnly={isReadOnly || totalAmountFromSubcategories > 0}
                    className={(isReadOnly || totalAmountFromSubcategories > 0) ? "bg-muted pl-10" : "pl-10"}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    GNF
                  </div>
                </div>
                {totalAmountFromSubcategories > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ⓘ Le montant est calculé automatiquement à partir des sous-catégories.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className={isReadOnly ? "bg-muted" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="submitted">Soumis</SelectItem>
                    <SelectItem value="validated">Validé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="description">Motif / Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Décrivez en détail le motif de cette demande d'opération..."
                rows={4}
                readOnly={isReadOnly}
                className={isReadOnly ? "bg-muted" : ""}
              />
            </div>

            {initialData?.status === 'rejected' && initialData?.rejection_reason && (
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Raison du rejet</Label>
                <Textarea
                  id="rejection_reason"
                  value={initialData.rejection_reason}
                  readOnly
                  rows={2}
                  className="bg-muted"
                />
              </div>
            )}

            {initialData?.status === 'validated' && initialData?.validation_date && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validation_date">Date de validation</Label>
                  <Input
                    id="validation_date"
                    type="date"
                    value={initialData.validation_date}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validated_by">Validé par</Label>
                  <Input
                    id="validated_by"
                    value={initialData.validated_by?.name || "N/A"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? "Fermer" : "Annuler"}
            </Button>
            {!isReadOnly && (
              <Button type="submit">{initialData ? "Mettre à jour" : "Enregistrer"} la demande</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
