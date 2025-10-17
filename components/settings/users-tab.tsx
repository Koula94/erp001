"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, UserPlus, Loader2 } from "lucide-react"
import { type User } from "@/lib/auth"
import { UserFormDialog } from "./user-form-dialog"
import { api } from "@/lib/api"

const roleColors = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  employee: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  hr: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  stock: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  finance: "bg-green-500/10 text-green-500 border-green-500/20",
}

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const response = await api.users.list() as any
        // Handle paginated response (results array) or direct array
        const usersData = Array.isArray(response) ? response : response.results || []
        setUsers(usersData as User[])
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load users")
        console.error("Error loading users:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddUser = () => {
    setEditingUser(undefined)
    setDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await api.users.update(editingUser.id, userData)
        setUsers(users.map((u) => (u.id === editingUser.id ? updatedUser as User : u)))
      } else {
        // Create new user
        const newUser = await api.users.create(userData)
        setUsers([...users, newUser as User])
      }
      setDialogOpen(false)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to save user")
      console.error("Error saving user:", err)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.users.delete(userId)
      setUsers(users.filter((u) => u.id !== userId))
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete user")
      console.error("Error deleting user:", err)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and access</CardDescription>
            </div>
            <Button onClick={handleAddUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No users found matching your search." : "No users found."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" alt={`${user.first_name} ${user.last_name}`} />
                      <AvatarFallback>
                        {`${user.first_name} ${user.last_name}`
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{`${user.first_name} ${user.last_name}`}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.department && <div className="text-xs text-muted-foreground mt-1">{user.department}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={roleColors[user.role]}>
                      {user.role}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} onSave={handleSaveUser} />
    </>
  )
}
