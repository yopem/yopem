"use client"

import dynamic from "next/dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
const Legend = dynamic(
  () => import("recharts").then((m) => ({ default: m.Legend })),
  { ssr: false },
)
const Line = dynamic(
  () => import("recharts").then((m) => ({ default: m.Line })),
  { ssr: false },
)

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
      </CardContent>
    </Card>
  )
}

export default WebhookEventsChart
