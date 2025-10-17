import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: LucideIcon
  format?: "currency" | "number" | "percentage"
}

export function StatCard({ title, value, change, icon: Icon, format = "number" }: StatCardProps) {
  const isPositive = change >= 0

  const formatValue = (val: string | number) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(Number(val))
    }
    if (format === "percentage") {
      return `${val}%`
    }
    return val
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <div className="flex items-center gap-1 text-xs mt-1">
          {isPositive ? (
            <ArrowUpIcon className="h-3 w-3 text-green-600" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 text-red-600" />
          )}
          <span className={cn("font-medium", isPositive ? "text-green-600" : "text-red-600")}>{Math.abs(change)}%</span>
          <span className="text-muted-foreground">from last month</span>
        </div>
      </CardContent>
    </Card>
  )
}
