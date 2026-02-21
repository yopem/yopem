import { Card } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus as MinusIcon,
} from "lucide-react"
import { type ReactNode } from "react"

interface StatsCardChange {
  value: string
  trend: "up" | "down" | "neutral"
}

interface StatsCardProps {
  title: string
  value: string
  change?: StatsCardChange
  icon: ReactNode
  loading?: boolean
}

const StatsCard = ({
  title,
  value,
  change,
  icon,
  loading = false,
}: StatsCardProps) => {
  if (loading) {
    return (
      <Card className="border-border bg-card flex flex-col gap-1 rounded-xl border p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-5 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-3 w-20" />
      </Card>
    )
  }

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-500"
      case "down":
        return "text-red-600 dark:text-red-500"
      case "neutral":
        return "text-muted-foreground"
    }
  }

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUpIcon className="size-3" />
      case "down":
        return <TrendingDownIcon className="size-3" />
      case "neutral":
        return <MinusIcon className="size-3" />
    }
  }

  return (
    <Card className="group border-border bg-card hover:border-muted-foreground/20 flex flex-col gap-1 rounded-xl border p-6 shadow-sm transition-all">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-foreground text-2xl font-bold tracking-tight">
        {value}
      </p>
      {change && (
        <div className="mt-1 flex items-center gap-1">
          <span className={getTrendColor(change.trend)}>
            {getTrendIcon(change.trend)}
          </span>
          <p className={`text-xs font-medium ${getTrendColor(change.trend)}`}>
            {change.value}
          </p>
        </div>
      )}
    </Card>
  )
}

export default StatsCard
