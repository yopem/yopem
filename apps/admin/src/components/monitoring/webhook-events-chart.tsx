"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { lazy, Suspense } from "react"

const ResponsiveContainer = lazy(() =>
  import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
)
const LineChart = lazy(() => import("recharts").then((m) => ({ default: m.LineChart })))
const CartesianGrid = lazy(() =>
  import("recharts").then((m) => ({ default: m.CartesianGrid })),
)
const XAxis = lazy(() => import("recharts").then((m) => ({ default: m.XAxis })))
const YAxis = lazy(() => import("recharts").then((m) => ({ default: m.YAxis })))
const Tooltip = lazy(() => import("recharts").then((m) => ({ default: m.Tooltip })))
const Legend = lazy(() => import("recharts").then((m) => ({ default: m.Legend })))
const Line = lazy(() => import("recharts").then((m) => ({ default: m.Line })))

interface DataPoint {
  date: string
  successCount: number
  failureCount: number
}

interface WebhookEventsChartProps {
  data: DataPoint[]
}

const WebhookEventsChart = ({ data }: WebhookEventsChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Events Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="bg-muted h-75 animate-pulse rounded-md" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => {
                  if (name === "successCount")
                    return [String(value ?? ""), "Success"]
                  if (name === "failureCount")
                    return [String(value ?? ""), "Failure"]
                  return [String(value ?? ""), String(name)]
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="successCount"
                stroke="#22c55e"
                strokeWidth={2}
                name="Success"
              />
              <Line
                type="monotone"
                dataKey="failureCount"
                stroke="#ef4444"
                strokeWidth={2}
                name="Failure"
              />
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}

export default WebhookEventsChart
