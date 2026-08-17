import type { ReactNode } from "react"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card"

interface QuickStartCardProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function QuickStartCard({
  icon,
  title,
  description,
  action,
}: QuickStartCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="text-muted-foreground mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && <CardFooter className="pt-0">{action}</CardFooter>}
    </Card>
  )
}
