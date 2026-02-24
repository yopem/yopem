"use client"

import { queryApi } from "@repo/orpc/query"
import { formatDateOnly } from "@repo/shared/format-date"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import Link from "@/components/link"
import { useQuery } from "@tanstack/react-query"
import { CreditCardIcon, DollarSignIcon, PlayIcon } from "lucide-react"
import { memo } from "react"

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

interface StatsData {
  balance: string
  totalUsed: string
  totalPurchased: string
  totalRuns: number
}

interface CreditsData {
  id: string
  userId: string
  balance: string
  totalPurchased: string
  totalUsed: string
  createdAt: Date
  updatedAt: Date | null
}

interface RunsData {
  runs: {
    id: string
    toolId: string | null
    status: string
    cost: string | null
    createdAt: Date | null
    toolName: string | null
  }[]
  nextCursor: string | undefined
}

function DashboardPage() {
  const { data: stats } = useQuery({
    ...queryApi.user.getStats.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data: StatsData | undefined
  }
  const { data: credits } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
  }) as { data: CreditsData | undefined | null }
  const { data: runsData } = useQuery({
    ...queryApi.user.getRuns.queryOptions({ input: { limit: 5 } }),
    retry: false,
    refetchOnWindowFocus: false,
  }) as { data: RunsData | undefined }

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
          title="Credit Balance"
          value={credits?.balance ?? "0"}
          icon={CreditCardIcon}
          description="Available credits"
        />
        <StatCard
          title="Total Runs"
          value={stats?.totalRuns ?? 0}
          icon={PlayIcon}
          description="Tool executions"
        />
        <StatCard
          title="Credits Used"
          value={stats?.totalUsed ?? "0"}
          icon={DollarSignIcon}
          description="Total spent"
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
                      <span className="text-muted-foreground text-sm">
                        {run.cost ?? 0} credits
                      </span>
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
              render={<Link href="/marketplace">Browse Marketplace</Link>}
            />
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/dashboard/profile">Edit Profile</Link>}
            />
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/dashboard/credits">Purchase Credits</Link>}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
