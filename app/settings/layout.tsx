import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings - SOFIXE ERP",
  description: "System settings and user management",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
