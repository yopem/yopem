"use client"

import { useEffect, useState } from "react"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import TimeRangeToggle, {
  type TimeRange,
} from "@/components/admin/monitoring/time-range-toggle"
import WebhookEventsChart from "@/components/admin/monitoring/webhook-events-chart"
import WebhookFilterToggle, {
  type EventType,
} from "@/components/admin/monitoring/webhook-filter-toggle"
import WebhookProcessingChart from "@/components/admin/monitoring/webhook-processing-chart"
import WebhookStatsCards from "@/components/admin/monitoring/webhook-stats-cards"
import { queryApi } from "@/lib/orpc/query"

interface MetricsData {
  dataPoints: {
    date: string
    successCount: number
    failureCount: number
    avgProcessingTime: number
  }[]
  summary: {
    totalProcessed: number
    successCount: number
    failureCount: number
    successRate: number
    avgProcessingTime: number
  }
}

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard/admin" },
  { label: "Monitoring" },
]

const MonitoringPage = () => {
  const [eventType, setEventType] = useState<EventType>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("24h")
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await queryApi.admin.getWebhookMetricsHistory.call({
          eventType: eventType === "all" ? undefined : eventType,
          timeRange,
        })
        setMetrics(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics")
      } finally {
        setLoading(false)
      }
    }

    void loadMetrics()
  }, [eventType, timeRange])

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-64 rounded-sm bg-gray-200"></div>
          <div className="h-96 rounded-sm bg-gray-200"></div>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />
        <div className="text-center text-red-600">
          {error ?? "Failed to load metrics"}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="Webhook Monitoring"
        description="Monitor Polar webhook processing metrics and performance"
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm font-medium">Event Type:</div>
          <WebhookFilterToggle value={eventType} onChange={setEventType} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm font-medium">Time Range:</div>
          <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      <WebhookStatsCards
        totalProcessed={metrics.summary.totalProcessed}
        successCount={metrics.summary.successCount}
        failureCount={metrics.summary.failureCount}
        avgProcessingTime={metrics.summary.avgProcessingTime}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WebhookEventsChart data={metrics.dataPoints} />
        <WebhookProcessingChart data={metrics.dataPoints} />
      </div>
    </div>
  )
}

export default MonitoringPage
