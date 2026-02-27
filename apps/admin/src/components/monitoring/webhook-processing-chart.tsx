"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { lazy, Suspense } from "react"

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

interface DataPoint {
  date: string
  avgProcessingTime: number
}

interface WebhookProcessingChartProps {
  data: DataPoint[]
}

const WebhookProcessingChart = ({ data }: WebhookProcessingChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Time Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={<div className="bg-muted h-75 animate-pulse rounded-md" />}
        >
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
                formatter={(value) => [
                  `${String(value ?? "")}ms`,
                  "Processing Time",
                ]}
              />
              <Line
                type="monotone"
                dataKey="avgProcessingTime"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Processing Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </CardContent>
    </Card>
  )
}

export default WebhookProcessingChart
