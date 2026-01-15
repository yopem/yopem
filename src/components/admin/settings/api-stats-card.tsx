import { type ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

interface ApiStatsCardProps {
  title: string
  value: string
  icon: ReactNode
  change?: {
    value: string
    trend: "up" | "down" | "neutral"
    icon?: ReactNode
  }
}

const ApiStatsCard = ({ title, value, icon, change }: ApiStatsCardProps) => {
  return (
    <Card className="hover:border-foreground/20 transition-colors">
      <CardContent className="flex flex-col justify-between p-5">
        <div className="mb-4 flex items-start justify-between">
          <span className="text-muted-foreground text-sm font-medium">
            {title}
          </span>
          <div className="text-muted-foreground [&>svg]:size-5">{icon}</div>
        </div>
        <div>
          <div className="text-foreground mb-1 text-2xl font-bold">{value}</div>
          {change && (
            <div
              className={`flex items-center gap-1 text-xs ${
                change.trend === "up"
                  ? "text-foreground"
                  : change.trend === "down"
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {change.icon && (
                <span className="[&>svg]:size-3.5">{change.icon}</span>
              )}
              <span>{change.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ApiStatsCard
