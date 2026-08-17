import { createFileRoute, useRouteContext } from "@tanstack/react-router"
import { CreditCardIcon } from "lucide-react"

import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
import { Separator } from "ui/separator"

export const Route = createFileRoute("/dashboard/subscription")({
  component: SubscriptionComponent,
})

function SubscriptionComponent() {
  const { session } = useRouteContext({ from: "__root__" })

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-0.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Subscription
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your plan and billing.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-border border-b pb-3">
          <CardTitle className="font-heading flex items-center gap-2 text-base font-semibold">
            <CreditCardIcon className="size-4" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardPanel className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                Plan Tier
              </p>
              <p className="text-foreground text-sm font-semibold">Free</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                Status
              </p>
              <p className="text-foreground text-sm font-semibold">Active</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                Account
              </p>
              <p className="text-foreground truncate text-sm">
                {session?.email}
              </p>
            </div>
          </div>

          <Separator />

          <p className="text-muted-foreground text-xs">
            Upgrade plans and billing options coming soon. Check back for
            updates.
          </p>
        </CardPanel>
      </Card>
    </div>
  )
}
