"use client"

import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { CrownIcon, SparklesIcon, ZapIcon } from "lucide-react"

import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"

const tierConfig = {
  free: {
    icon: SparklesIcon,
    label: "Free",
    color: "bg-muted text-muted-foreground",
  },
  pro: {
    icon: ZapIcon,
    label: "Pro",
    color: "bg-primary/10 text-primary",
  },
  enterprise: {
    icon: CrownIcon,
    label: "Enterprise",
    color: "bg-amber-500/10 text-amber-600",
  },
}

export default function UserCredits() {
  const { data: subscription } = useQuery({
    ...queryApi.user.getSubscription.queryOptions(),
  }) as {
    data:
      | {
          tier: "free" | "pro" | "enterprise"
          status: string
          isPaid: boolean
          cancelAtPeriodEnd: boolean
          currentPeriodEnd: string | null
          limits: {
            maxRequestsPerMonth: number
          }
        }
      | undefined
      | null
  }

  if (!subscription) return null

  const config = tierConfig[subscription.tier]
  const Icon = config.icon

  return (
    <div className="border-border bg-card rounded-lg border p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full ${config.color}`}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium">
              Your plan
            </p>
            <div className="flex items-center gap-2">
              <p className="text-foreground text-xl font-bold tracking-tight">
                {config.label}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <Badge variant="secondary" className="text-xs">
                  Cancels soon
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly limit</span>
            <span className="text-foreground font-medium">
              {subscription.limits.maxRequestsPerMonth.toLocaleString()}{" "}
              requests
            </span>
          </div>
          {subscription.isPaid && subscription.currentPeriodEnd && (
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Renews on</span>
              <span className="text-foreground font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant={subscription.isPaid ? "secondary" : "default"}
          className="h-10 w-full"
          render={<Link to="/dashboard/subscription" />}
        >
          {subscription.isPaid ? "Manage subscription" : "Upgrade plan"}
        </Button>
      </div>
    </div>
  )
}
