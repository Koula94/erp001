import { Metadata } from "next"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export const metadata: Metadata = {
  title: "Finance & Comptabilité - Sofixe ERP",
  description: "Gérez les factures, dépenses, budgets et rapports financiers de SOFI",
}

interface FinanceLayoutProps {
  children: React.ReactNode
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <div className="space-y-4 p-8 pt-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
