import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router"
import { CoinsIcon, CreditCardIcon, PlayIcon, ZapIcon } from "lucide-react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
import { formatDateOnly } from "utils/format-date"

export const Route = createFileRoute("/dashboard/")({
  loader: async ({ context: { queryClient } }) => {
    const [stats, runs] = await Promise.all([
      queryClient.ensureQueryData(queryApi.user.stats.queryOptions()),
      queryClient.ensureQueryData(
        queryApi.user.runs.queryOptions({ input: { limit: 5 } }),
      ),
    ])
    return { stats, runs }
  },
  component: DashboardOverviewComponent,
})

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string | number
  icon: typeof CreditCardIcon
  description?: string
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardPanel className="p-5 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
      </CardPanel>
    </Card>
  )
}

function StatusPill({ status }: { status: string | null }) {
  let className =
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
  switch (status) {
    case "completed":
      className =
        "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      break
    case "failed":
      className = "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
      break
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {status ?? "pending"}
    </span>
  )
}

function DashboardOverviewComponent() {
  const { stats: initialStats, runs: initialRuns } = useLoaderData({
    from: "/dashboard/",
  })

  const statsQuery = useQuery(queryApi.user.stats.queryOptions())
  const runsQuery = useQuery(
    queryApi.user.runs.queryOptions({ input: { limit: 5 } }),
  )

  const stats = statsQuery.data ?? initialStats
  const runs = runsQuery.data ?? initialRuns

  const requestsUsed = stats.totalRuns ?? 0

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Plan"
          value="Free"
          icon={ZapIcon}
          description="Free plan"
        />
        <StatCard
          title="Total Runs"
          value={requestsUsed}
          icon={PlayIcon}
          description="Tool executions"
        />
        <StatCard
          title="Requests"
          value={`${requestsUsed}`}
          icon={CreditCardIcon}
          description="Monthly usage"
        />
        {Number(stats.overflowBalance ?? 0) > 0 && (
          <StatCard
            title="Extra Runs"
            value={stats.overflowBalance ?? "0"}
            icon={CoinsIcon}
            description="Available for over-quota runs"
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="border-border border-b p-5">
            <CardTitle className="text-base font-semibold">
              Recent Runs
            </CardTitle>
          </CardHeader>
          <CardPanel className="p-5">
            {runs.runs.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No runs yet
              </p>
            ) : (
              <div className="space-y-4">
                {runs.runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {run.productName ?? "Unknown Product"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateOnly(run.createdAt) || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={run.status} />
                      {run.cost ? (
                        <span className="text-muted-foreground text-xs">
                          {run.cost} credits
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardPanel>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="border-border border-b p-5">
            <CardTitle className="text-base font-semibold">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardPanel className="space-y-3 p-5">
            <Button
              className="w-full justify-center"
              render={<Link to="/products">Browse Marketplace</Link>}
            />
            <Button
              variant="outline"
              className="w-full justify-center"
              render={<Link to="/dashboard/profile">Edit Profile</Link>}
            />
            <Button
              variant="outline"
              className="w-full justify-center"
              render={
                <Link to="/dashboard/subscription">Manage Subscription</Link>
              }
            />
          </CardPanel>
        </Card>
      </div>
    </div>
  )
}
