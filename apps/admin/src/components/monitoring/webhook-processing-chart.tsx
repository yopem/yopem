"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import dynamic from "next/dynamic"

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
      </CardContent>
    </Card>
  )
}

export default WebhookProcessingChart
