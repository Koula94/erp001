const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiError {
  message: string
  status: number
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Don't access localStorage during SSR
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token")
    }
  }

  setToken(token: string) {
    this.token = token
    // Don't access localStorage during SSR
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token)
    }
  }

  clearToken() {
    this.token = null
    // Don't access localStorage during SSR
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers({
      "Content-Type": "application/json",
      ...options.headers,
    })

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} error`
      try {
        const rawText = await response.text()
        if (rawText) {
          try {
            // Try to parse as JSON for structured error messages
            const errorData = JSON.parse(rawText)
            if (errorData.detail) {
              // Standard DRF error format: { "detail": "..." }
              errorMessage = errorData.detail
            } else if (errorData.message) {
              errorMessage = errorData.message
            } else if (typeof errorData === 'object' && !Array.isArray(errorData)) {
              // DRF field validation errors: { "field": ["error1", "error2"], ... }
              const fieldErrors = Object.entries(errorData)
                .map(([field, errors]) => {
                  const msgs = Array.isArray(errors) ? errors.join(', ') : String(errors)
                  return field === 'non_field_errors' ? msgs : `${field}: ${msgs}`
                })
                .join(' | ')
              errorMessage = fieldErrors || rawText
            } else {
              errorMessage = rawText
            }
          } catch {
            // Not JSON – use the raw text
            errorMessage = rawText
          }
        }
      } catch {
        // response.text() failed
      }
      
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      }
      throw error
    }

    // Handle empty responses (like for DELETE operations)
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json()
    } else {
      // For empty responses, return an empty object
      return {} as T
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.post<{ user: any; access: string; refresh: string }>("/users/auth/login/", { username, password })
    this.setToken(response.access)
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", response.refresh)
      localStorage.setItem("sofixe_user", JSON.stringify(response.user))
    }
    return response
  }

  async refreshToken() {
    if (typeof window === "undefined") return

    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) throw new Error("No refresh token")

    const response = await this.post<{ access: string }>("/token/refresh/", {
      refresh: refreshToken,
    })
    this.setToken(response.access)
    return response
  }

  // CRM
  clients = {
    list: () => this.get("/crm/clients/"),
    get: (id: string) => this.get(`/crm/clients/${id}/`),
    create: (data: any) => this.post("/crm/clients/", data),
    update: (id: string, data: any) => this.put(`/crm/clients/${id}/`, data),
    delete: (id: string) => this.delete(`/crm/clients/${id}/`),
  }

  quotes = {
    list: () => this.get("/crm/quotes/"),
    get: (id: string) => this.get(`/crm/quotes/${id}/`),
    create: (data: any) => this.post("/crm/quotes/", data),
    update: (id: string, data: any) => this.put(`/crm/quotes/${id}/`, data),
    delete: (id: string) => this.delete(`/crm/quotes/${id}/`),
  }

  communications = {
    list: () => this.get("/crm/communications/"),
    create: (data: any) => this.post("/crm/communications/", data),
  }

  // Projects
  projects = {
    list: () => this.get("/projects/projects/"),
    get: (id: string) => this.get(`/projects/projects/${id}/`),
    create: (data: any) => this.post("/projects/projects/", data),
    update: (id: string, data: any) => this.put(`/projects/projects/${id}/`, data),
    delete: (id: string) => this.delete(`/projects/projects/${id}/`),
  }

  tasks = {
    list: (query?: string) => this.get(`/projects/tasks/${query ? `?${query}` : ""}`),
    get: (id: string) => this.get(`/projects/tasks/${id}/`),
    create: (data: any) => this.post("/projects/tasks/", data),
    update: (id: string, data: any) => this.put(`/projects/tasks/${id}/`, data),
    delete: (id: string) => this.delete(`/projects/tasks/${id}/`),
  }

  milestones = {
    list: (query?: string) => this.get(`/projects/milestones/${query ? `?${query}` : ""}`),
    get: (id: string) => this.get(`/projects/milestones/${id}/`),
    create: (data: any) => this.post("/projects/milestones/", data),
    update: (id: string, data: any) => this.put(`/projects/milestones/${id}/`, data),
    delete: (id: string) => this.delete(`/projects/milestones/${id}/`),
  }

  // HR
  employees = {
    list: () => this.get("/hr/employees/"),
    get: (id: string) => this.get(`/hr/employees/${id}/`),
    create: (data: any) => this.post("/hr/employees/", data),
    update: (id: string, data: any) => this.put(`/hr/employees/${id}/`, data),
    delete: (id: string) => this.delete(`/hr/employees/${id}/`),
  }

  payroll = {
    list: () => this.get("/hr/payroll/"),
    create: (data: any) => this.post("/hr/payroll/", data),
  }

  leaveRequests = {
    list: () => this.get("/hr/leave-requests/"),
    create: (data: any) => this.post("/hr/leave-requests/", data),
    update: (id: string, data: any) => this.patch(`/hr/leave-requests/${id}/`, data),
  }

  performanceReviews = {
    list: () => this.get("/hr/performance-reviews/"),
    create: (data: any) => this.post("/hr/performance-reviews/", data),
  }

  // Stock
  materials = {
    list: () => this.get("/stock/materials/"),
    create: (data: any) => this.post("/stock/materials/", data),
    update: (id: string, data: any) => this.put(`/stock/materials/${id}/`, data),
    delete: (id: string) => this.delete(`/stock/materials/${id}/`),
    recalculateStatuses: () => this.post("/stock/materials/recalculate_statuses/", {}),
  }

  equipment = {
    list: () => this.get("/stock/equipment/"),
    create: (data: any) => this.post("/stock/equipment/", data),
    update: (id: string, data: any) => this.put(`/stock/equipment/${id}/`, data),
    delete: (id: string) => this.delete(`/stock/equipment/${id}/`),
  }

  stockTransactions = {
    list: () => this.get("/stock/transactions/"),
    create: (data: any) => this.post("/stock/transactions/", data),
  }

  warehouses = {
    list: () => this.get("/stock/warehouses/"),
    create: (data: any) => this.post("/stock/warehouses/", data),
    update: (id: string, data: any) => this.put(`/stock/warehouses/${id}/`, data),
    delete: (id: string) => this.delete(`/stock/warehouses/${id}/`),
  }

  // Finance
  invoices = {
    list: () => this.get("/finance/invoices/"),
    get: (id: string) => this.get(`/finance/invoices/${id}/`),
    create: (data: any) => this.post("/finance/invoices/", data),
    update: (id: string, data: any) => this.put(`/finance/invoices/${id}/`, data),
    delete: (id: string) => this.delete(`/finance/invoices/${id}/`),
    downloadPdf: (id: string) => this.get(`/finance/invoices/${id}/download_pdf/`),
    preview: (id: string) => this.get(`/finance/invoices/${id}/preview/`),
  }

  expenses = {
    list: () => this.get("/finance/expenses/"),
    create: (data: any) => this.post("/finance/expenses/", data),
    update: (id: string, data: any) => this.patch(`/finance/expenses/${id}/`, data),
  }

  budgets = {
    list: () => this.get("/finance/budgets/"),
    create: (data: any) => this.post("/finance/budgets/", data),
    update: (id: string, data: any) => this.put(`/finance/budgets/${id}/`, data),
  }

  // Users
  users = {
    list: () => this.get("/users/"),
    get: (id: string) => this.get(`/users/${id}/`),
    create: (data: any) => this.post("/users/", data),
    // Use PATCH for partial update — avoids "is_active: This field is required" DRF error
    update: (id: string, data: any) => this.patch(`/users/${id}/`, data),
    delete: (id: string) => this.delete(`/users/${id}/`),
  }
}

// Create a lazy-loaded API client to avoid SSR issues
let apiInstance: ApiClient | null = null

function getApiInstance(): ApiClient {
  if (!apiInstance) {
    apiInstance = new ApiClient(API_BASE_URL)
  }
  return apiInstance
}

export const api = getApiInstance()
