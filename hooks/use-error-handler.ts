"use client"

import { useState, useCallback } from "react"
import { useToast } from "./use-toast"

interface ErrorHandlerOptions {
  showToast?: boolean
  retryCount?: number
  retryDelay?: number
}

interface UseErrorHandlerReturn {
  error: string | null
  isLoading: boolean
  hasError: boolean
  handleError: (error: any, context?: string) => void
  clearError: () => void
  withErrorHandling: <T>(
    operation: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error)
    
    let errorMessage = "Une erreur s'est produite"
    
    if (typeof error === 'string') {
      errorMessage = error
    } else if (error?.message) {
      errorMessage = error.message
    } else if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.status === 401) {
      errorMessage = "Session expirée. Veuillez vous reconnecter."
    } else if (error?.status === 403) {
      errorMessage = "Accès refusé. Vous n'avez pas les permissions nécessaires."
    } else if (error?.status === 404) {
      errorMessage = "Ressource non trouvée."
    } else if (error?.status === 500) {
      errorMessage = "Erreur serveur. Veuillez réessayer plus tard."
    } else if (error?.status === 0) {
      errorMessage = "Erreur de connexion. Vérifiez votre connexion internet."
    }

    setError(errorMessage)
    
    toast({
      variant: "destructive",
      title: "Erreur",
      description: errorMessage,
      duration: 5000,
    })

    return errorMessage
  }, [toast])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    const {
      showToast = true,
      retryCount = 0,
      retryDelay = 1000
    } = options

    setIsLoading(true)
    clearError()

    let lastError: any = null
    let attempts = 0

    while (attempts <= retryCount) {
      try {
        if (attempts > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
        }

        const result = await operation()
        setIsLoading(false)
        return result

      } catch (error) {
        lastError = error
        attempts++

        if (attempts > retryCount) {
          // Final attempt failed
          setIsLoading(false)
          if (showToast) {
            handleError(error, `Operation after ${attempts} attempts`)
          }
          return null
        } else {
          console.warn(`Attempt ${attempts} failed, retrying...`, error)
        }
      }
    }

    setIsLoading(false)
    return null
  }, [handleError, clearError])

  return {
    error,
    isLoading,
    hasError: error !== null,
    handleError,
    clearError,
    withErrorHandling,
  }
}

// Hook spécifique pour les projets
export function useProjectErrorHandler() {
  const baseHandler = useErrorHandler()

  const handleProjectError = useCallback((error: any, operation: string) => {
    let context = `Project ${operation}`
    
    // Messages personnalisés pour les opérations de projets
    let customContext = context
    if (operation === 'load') {
      customContext = "Impossible de charger les projets"
    } else if (operation === 'create') {
      customContext = "Impossible de créer le projet"
    } else if (operation === 'update') {
      customContext = "Impossible de mettre à jour le projet"
    } else if (operation === 'delete') {
      customContext = "Impossible de supprimer le projet"
    }

    baseHandler.handleError(error, customContext)
  }, [baseHandler])

  return {
    ...baseHandler,
    handleProjectError,
  }
}

// Hook spécifique pour les tâches
export function useTaskErrorHandler() {
  const baseHandler = useErrorHandler()

  const handleTaskError = useCallback((error: any, operation: string) => {
    let context = `Task ${operation}`
    
    // Messages personnalisés pour les opérations de tâches
    let customContext = context
    if (operation === 'load') {
      customContext = "Impossible de charger les tâches"
    } else if (operation === 'create') {
      customContext = "Impossible de créer la tâche"
    } else if (operation === 'update') {
      customContext = "Impossible de mettre à jour la tâche"
    } else if (operation === 'delete') {
      customContext = "Impossible de supprimer la tâche"
    }

    baseHandler.handleError(error, customContext)
  }, [baseHandler])

  return {
    ...baseHandler,
    handleTaskError,
  }
}

// Hook spécifique pour les jalons
export function useMilestoneErrorHandler() {
  const baseHandler = useErrorHandler()

  const handleMilestoneError = useCallback((error: any, operation: string) => {
    let context = `Milestone ${operation}`
    
    // Messages personnalisés pour les opérations de jalons
    let customContext = context
    if (operation === 'load') {
      customContext = "Impossible de charger les jalons"
    } else if (operation === 'create') {
      customContext = "Impossible de créer le jalon"
    } else if (operation === 'update') {
      customContext = "Impossible de mettre à jour le jalon"
    } else if (operation === 'delete') {
      customContext = "Impossible de supprimer le jalon"
    }

    baseHandler.handleError(error, customContext)
  }, [baseHandler])

  return {
    ...baseHandler,
    handleMilestoneError,
  }
}
