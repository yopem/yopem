"use client"

import { queryApi } from "@repo/orpc/query"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { useQuery } from "@tanstack/react-query"
import { useState, lazy, Suspense } from "react"

const ResponsiveContainer = lazy(() =>
  import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
)
const LineChart = lazy(() =>
  import("recharts").then((m) => ({ default: m.LineChart })),
)
const CartesianGrid = lazy(() =>
  import("recharts").then((m) => ({ default: m.CartesianGrid })),
)
const XAxis = lazy(() => import("recharts").then((m) => ({ default: m.XAxis })))
const YAxis = lazy(() => import("recharts").then((m) => ({ default: m.YAxis })))
const Tooltip = lazy(() =>
  import("recharts").then((m) => ({ default: m.Tooltip })),
)
const Line = lazy(() => import("recharts").then((m) => ({ default: m.Line })))

const UptimeChart = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d")

  const { data, isLoading } = useQuery({
    ...queryApi.admin.getUptimeHistory.queryOptions({
      input: { timeRange },
    }),
    refetchInterval: 30000,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Uptime History</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="bg-muted h-72 animate-pulse rounded-md" />
        ) : (
          <Suspense
            fallback={
              <div className="bg-muted h-72 animate-pulse rounded-md" />
            }
          >
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={data?.dataPoints ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "Uptime",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="uptimePercentage"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Uptime %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        )}
      </CardContent>
    </Card>
  )
}

export default UptimeChart
