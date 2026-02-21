"use client"

import { queryApi } from "@repo/api/orpc/query"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useState } from "react"

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
)
const LineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false },
)
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false },
)
const XAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.XAxis })),
  { ssr: false },
)
const YAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.YAxis })),
  { ssr: false },
)
const Tooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false },
)
const Line = dynamic(
  () => import("recharts").then((m) => ({ default: m.Line })),
  { ssr: false },
)

interface AiRequestsChartProps {
  totalRequests: number
}

const AiRequestsChart = ({ totalRequests }: AiRequestsChartProps) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d")

  const { data, isLoading } = useQuery({
    ...queryApi.admin.getAiRequestsHistory.queryOptions({
      input: { timeRange },
    }),
    refetchInterval: 30000,
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Token Usage Overview
            </p>
            <h3 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
              {totalRequests.toLocaleString()} AI Requests
            </h3>
          </div>
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
          <div className="bg-muted h-64 animate-pulse rounded-md" />
        ) : (
          <ResponsiveContainer width="100%" height={256}>
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
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [String(value ?? ""), "AI Requests"]}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="AI Requests"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default AiRequestsChart
