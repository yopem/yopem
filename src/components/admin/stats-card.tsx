import { type ReactNode } from "react"

import { Card } from "@/components/ui/card"

interface StatsCardChange {
  value: string
  trend: "up" | "down" | "neutral"
}

interface StatsCardProps {
  title: string
  value: string
  change?: StatsCardChange
  icon: ReactNode
}

const StatsCard = ({ title, value, change, icon }: StatsCardProps) => {
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
          <p
            className={`text-xs font-medium ${
              change.trend === "neutral"
                ? "text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {change.value}
          </p>
        </div>
      )}
    </Card>
  )
}

export default StatsCard
