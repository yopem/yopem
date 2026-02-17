"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
