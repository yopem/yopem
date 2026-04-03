"use client"

import { Card, CardContent, CardHeader, CardTitle } from "ui/card"

import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "@/components/charts/line-chart-wrapper"

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
