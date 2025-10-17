"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, type AuthResponse, type LoginRequest } from "@/lib/auth"
import { api } from "@/lib/api"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("sofixe_user")
    const accessToken = localStorage.getItem("access_token")

    if (storedUser && accessToken) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        
        // Verify token is still valid by fetching current user
        fetchCurrentUser()
      } catch (error) {
        console.error("Error parsing stored user:", error)
        clearAuthData()
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      // Use the custom auth endpoint to get current user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/users/auth/me/`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem("sofixe_user", JSON.stringify(userData))
      } else {
        // Token might be expired, try to refresh
        await refreshTokenAndFetchUser()
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
      clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTokenAndFetchUser = async () => {
    try {
      await api.refreshToken()
      await fetchCurrentUser()
    } catch (error) {
      console.error("Error refreshing token:", error)
      clearAuthData()
    }
  }

  const clearAuthData = () => {
    setUser(null)
    localStorage.removeItem("sofixe_user")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    api.clearToken()
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use the custom login endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/users/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const authData: AuthResponse = await response.json()
        
        // Store tokens and user data
        localStorage.setItem("access_token", authData.access)
        localStorage.setItem("refresh_token", authData.refresh)
        localStorage.setItem("sofixe_user", JSON.stringify(authData.user))
        
        // Set token in API client
        api.setToken(authData.access)
        
        // Update state
        setUser(authData.user)
        
        return true
      } else {
        const errorData = await response.json()
        console.error("Login failed:", errorData)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        // Call logout endpoint to blacklist token
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/users/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearAuthData()
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
