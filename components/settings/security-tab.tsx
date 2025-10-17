"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Shield, Clock, AlertTriangle } from "lucide-react"

export function SecurityTab() {
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: "8",
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: "30",
    twoFactorAuth: false,
    loginAttempts: "5",
  })

  const [auditLogs] = useState([
    {
      id: "1",
      user: "admin@sofixe.com",
      action: "User login",
      timestamp: "2024-01-15 09:30:00",
      ip: "192.168.1.100",
      status: "success",
    },
    {
      id: "2",
      user: "manager@sofixe.com",
      action: "Project created",
      timestamp: "2024-01-15 10:15:00",
      ip: "192.168.1.101",
      status: "success",
    },
    {
      id: "3",
      user: "unknown",
      action: "Failed login attempt",
      timestamp: "2024-01-15 11:00:00",
      ip: "203.0.113.42",
      status: "failed",
    },
  ])

  const handleSave = () => {
    console.log("[v0] Saving security settings:", securitySettings)
    // In a real app, this would save to a backend
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password Policy</CardTitle>
          <CardDescription>Configure password requirements for all users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Length</Label>
              <Select
                value={securitySettings.passwordMinLength}
                onValueChange={(value) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordMinLength: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 characters</SelectItem>
                  <SelectItem value="8">8 characters</SelectItem>
                  <SelectItem value="10">10 characters</SelectItem>
                  <SelectItem value="12">12 characters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginAttempts">Max Login Attempts</Label>
              <Select
                value={securitySettings.loginAttempts}
                onValueChange={(value) =>
                  setSecuritySettings({
                    ...securitySettings,
                    loginAttempts: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Special Characters</Label>
                <p className="text-sm text-muted-foreground">Password must contain special characters (!@#$%)</p>
              </div>
              <Switch
                checked={securitySettings.passwordRequireSpecial}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireSpecial: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Numbers</Label>
                <p className="text-sm text-muted-foreground">Password must contain at least one number</p>
              </div>
              <Switch
                checked={securitySettings.passwordRequireNumbers}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireNumbers: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Uppercase</Label>
                <p className="text-sm text-muted-foreground">Password must contain uppercase letters</p>
              </div>
              <Switch
                checked={securitySettings.passwordRequireUppercase}
                onCheckedChange={(checked) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireUppercase: checked,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Configure session timeout and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Select
              value={securitySettings.sessionTimeout}
              onValueChange={(value) =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
            </div>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSecuritySettings({
                  ...securitySettings,
                  twoFactorAuth: checked,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Recent security and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <Shield className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.user} • {log.ip}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {log.timestamp}
                  </div>
                  <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Security Settings</Button>
      </div>
    </div>
  )
}
