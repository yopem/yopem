import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { CreditCardIcon, PlayIcon, ZapIcon } from "lucide-react"
import { memo } from "react"

import { queryApi } from "rpc/query"
import { formatDateOnly } from "shared/format-date"
import { Button } from "ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "ui/card"

export const Route = createFileRoute("/_user/dashboard/")({
  component: DashboardPage,
})

const StatCard = memo(
  ({
    title,
    value,
    icon: Icon,
    description,
  }: {
    title: string
    value: string | number
    icon: typeof CreditCardIcon
    description?: string
  }) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
        </CardContent>
      </Card>
    )
  },
)
StatCard.displayName = "StatCard"

function DashboardPage() {
  const { data: stats } = useQuery({
    ...queryApi.user.getStats.queryOptions(),
  })
  const { data: subscription } = useQuery({
    ...queryApi.user.getSubscription.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  })
  const { data: runsData } = useQuery({
    ...queryApi.user.getRuns.queryOptions({ input: { limit: 5 } }),
  })

  const currentTier = subscription?.tier ?? "free"
  const isPaid = subscription?.isPaid ?? false
  const status = subscription?.status ?? "active"
  const limits = subscription?.limits

  const requestsUsed = stats?.totalRuns ?? 0
  const requestsLimit = limits?.maxRequestsPerMonth ?? 0
  const requestsText =
    requestsLimit === Number.POSITIVE_INFINITY
      ? "Unlimited"
      : `${requestsUsed} / ${requestsLimit.toLocaleString()}`

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Current Plan"
          value={currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
          icon={ZapIcon}
          description={
            isPaid && status === "active"
              ? "Active subscription"
              : status === "cancelled"
                ? "Cancelled"
                : "Free plan"
          }
        />
        <StatCard
          title="Total Runs"
          value={requestsUsed}
          icon={PlayIcon}
          description="Tool executions"
        />
        <StatCard
          title="Requests"
          value={requestsText}
          icon={CreditCardIcon}
          description="Monthly usage"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {runsData?.runs && runsData.runs.length > 0 ? (
              <div className="space-y-4">
                {runsData.runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {run.toolName ?? "Unknown Tool"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {formatDateOnly(run.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : run.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {run.status}
                      </span>
                      {run.cost ? (
                        <span className="text-muted-foreground text-sm">
                          {run.cost} credits
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">
                No runs yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              render={<Link to="/marketplace">Browse Marketplace</Link>}
            />
            <Button
              variant="outline"
              className="w-full"
              render={<Link to="/dashboard/profile">Edit Profile</Link>}
            />
            <Button
              variant="outline"
              className="w-full"
              render={
                <Link to="/dashboard/subscription">Manage Subscription</Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
