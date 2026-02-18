"use client"

import {
  BarChartIcon,
  CheckCircleIcon,
  DollarSignIcon,
  KeyIcon,
  ServerIcon,
  UsersIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import ActivityLogsList from "@/components/admin/monitoring/activity-logs-list"
import TimeRangeToggle, {
  type TimeRange,
} from "@/components/admin/monitoring/time-range-toggle"
import UptimeStats from "@/components/admin/monitoring/uptime-stats"
import WebhookFilterToggle, {
  type EventType,
} from "@/components/admin/monitoring/webhook-filter-toggle"
import StatsCard from "@/components/admin/stats-card"
import { useApiKeyStats } from "@/hooks/use-api-keys"
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { queryApi } from "@/lib/orpc/query"

const UptimeChart = dynamic(
  () => import("@/components/admin/monitoring/uptime-chart"),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-72 animate-pulse rounded-md" />,
  },
)

const WebhookEventsChart = dynamic(
  () => import("@/components/admin/monitoring/webhook-events-chart"),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-72 animate-pulse rounded-md" />,
  },
)

const WebhookProcessingChart = dynamic(
  () => import("@/components/admin/monitoring/webhook-processing-chart"),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-72 animate-pulse rounded-md" />,
  },
)

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

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard/admin" },
  { label: "Monitoring" },
]

export default function MonitoringPage() {
  const [eventType, setEventType] = useState<EventType>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("24h")
  const [webhookMetrics, setWebhookMetrics] = useState<MetricsData | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(true)
  const [webhookError, setWebhookError] = useState<string | null>(null)

  const { data: systemMetrics, isLoading: systemLoading } = useSystemMetrics()
  const { data: apiKeyStats, isLoading: apiKeyLoading } = useApiKeyStats()

  useEffect(() => {
    let cancelled = false
    const loadMetrics = async () => {
      setWebhookLoading(true)
      setWebhookError(null)
      const eventTypeParam = eventType === "all" ? undefined : eventType
      try {
        const result = await queryApi.admin.getWebhookMetricsHistory.call({
          eventType: eventTypeParam,
          timeRange,
        })
        if (!cancelled) {
          setWebhookMetrics(result)
        }
      } catch (err) {
        if (!cancelled) {
          setWebhookError(
            err instanceof Error ? err.message : "Failed to load metrics",
          )
        }
      }
      if (!cancelled) {
        setWebhookLoading(false)
      }
    }

    void loadMetrics()
    return () => {
      cancelled = true
    }
  }, [eventType, timeRange])

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="System Monitoring"
        description="Complete platform health and performance metrics"
      />

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            System Overview
          </h2>
          <p className="text-muted-foreground text-sm">
            Key platform metrics and performance indicators
          </p>
        </div>

        <Shimmer loading={systemLoading}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(systemMetrics?.revenue ?? 0)}
              change={
                systemMetrics?.revenueChange
                  ? {
                      value: systemMetrics.revenueChange,
                      trend: systemMetrics.revenueChange.startsWith("+")
                        ? "up"
                        : systemMetrics.revenueChange.startsWith("-")
                          ? "down"
                          : "neutral",
                    }
                  : undefined
              }
              icon={<DollarSignIcon className="size-4.5" />}
              loading={systemLoading}
            />
            <StatsCard
              title="Active Users"
              value={formatNumber(systemMetrics?.activeUsers ?? 0)}
              change={
                systemMetrics?.activeUsersChange
                  ? {
                      value: systemMetrics.activeUsersChange,
                      trend: systemMetrics.activeUsersChange.startsWith("+")
                        ? "up"
                        : systemMetrics.activeUsersChange.startsWith("-")
                          ? "down"
                          : "neutral",
                    }
                  : undefined
              }
              icon={<UsersIcon className="size-4.5" />}
              loading={systemLoading}
            />
            <StatsCard
              title="AI Requests"
              value={formatNumber(systemMetrics?.aiRequests ?? 0)}
              change={
                systemMetrics?.aiRequestsChange
                  ? {
                      value: systemMetrics.aiRequestsChange,
                      trend: systemMetrics.aiRequestsChange.startsWith("+")
                        ? "up"
                        : systemMetrics.aiRequestsChange.startsWith("-")
                          ? "down"
                          : "neutral",
                    }
                  : undefined
              }
              icon={<ZapIcon className="size-4.5" />}
              loading={systemLoading}
            />
            <StatsCard
              title="System Uptime"
              value={systemMetrics?.systemUptime ?? "99.9%"}
              change={
                systemMetrics?.systemUptimeChange
                  ? {
                      value: systemMetrics.systemUptimeChange,
                      trend: "neutral",
                    }
                  : undefined
              }
              icon={<ServerIcon className="size-4.5" />}
              loading={systemLoading}
            />
          </div>
        </Shimmer>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">API Usage</h2>
          <p className="text-muted-foreground text-sm">
            API key utilization and cost metrics
          </p>
        </div>

        <Shimmer loading={apiKeyLoading}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Requests"
              value={(apiKeyStats?.totalRequests ?? 0).toLocaleString()}
              icon={<BarChartIcon className="size-4.5" />}
              loading={apiKeyLoading}
            />
            <StatsCard
              title="Active Keys"
              value={apiKeyStats?.activeKeys?.toString() ?? "0"}
              icon={<KeyIcon className="size-4.5" />}
              loading={apiKeyLoading}
            />
            <StatsCard
              title="Monthly Cost"
              value={`$${(apiKeyStats?.monthlyCost ?? 0).toFixed(2)}`}
              change={
                apiKeyStats?.costChange && apiKeyStats.costChange !== "N/A"
                  ? {
                      value: `${apiKeyStats.costChange} from last month`,
                      trend: apiKeyStats.costChange.startsWith("+")
                        ? "up"
                        : apiKeyStats.costChange.startsWith("-")
                          ? "down"
                          : "neutral",
                    }
                  : undefined
              }
              icon={<DollarSignIcon className="size-4.5" />}
              loading={apiKeyLoading}
            />
          </div>
        </Shimmer>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Webhook Monitoring
          </h2>
          <p className="text-muted-foreground text-sm">
            Polar webhook processing metrics and performance
          </p>
        </div>

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

        {webhookError ? (
          <div className="text-center text-red-600">{webhookError}</div>
        ) : (
          <>
            <Shimmer loading={webhookLoading}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Processed"
                  value={(
                    webhookMetrics?.summary.totalProcessed ?? 0
                  ).toLocaleString()}
                  icon={<BarChartIcon className="size-4.5" />}
                  loading={webhookLoading}
                />
                <StatsCard
                  title="Success Count"
                  value={(
                    webhookMetrics?.summary.successCount ?? 0
                  ).toLocaleString()}
                  change={{
                    value: "",
                    trend: "up",
                  }}
                  icon={<CheckCircleIcon className="size-4.5" />}
                  loading={webhookLoading}
                />
                <StatsCard
                  title="Failure Count"
                  value={(
                    webhookMetrics?.summary.failureCount ?? 0
                  ).toLocaleString()}
                  change={{
                    value: "",
                    trend: "down",
                  }}
                  icon={<XCircleIcon className="size-4.5" />}
                  loading={webhookLoading}
                />
                <StatsCard
                  title="Success Rate"
                  value={`${(webhookMetrics?.summary.successRate ?? 0).toFixed(1)}%`}
                  icon={<CheckCircleIcon className="size-4.5" />}
                  loading={webhookLoading}
                />
              </div>
            </Shimmer>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <WebhookEventsChart data={webhookMetrics?.dataPoints ?? []} />
              <WebhookProcessingChart data={webhookMetrics?.dataPoints ?? []} />
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            System Uptime
          </h2>
          <p className="text-muted-foreground text-sm">
            Platform availability and downtime metrics
          </p>
        </div>
        <UptimeStats />
        <div className="mt-4">
          <UptimeChart />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">
            Activity Logs
          </h2>
          <p className="text-muted-foreground text-sm">
            System events and operational activity
          </p>
        </div>
        <ActivityLogsList />
      </section>
    </div>
  )
}
