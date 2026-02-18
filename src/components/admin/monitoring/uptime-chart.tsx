"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { queryApi } from "@/lib/orpc/query"

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
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
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
        )}
      </CardContent>
    </Card>
  )
}

export default UptimeChart
