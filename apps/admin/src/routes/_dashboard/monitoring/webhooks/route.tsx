import { createFileRoute } from "@tanstack/react-router"
import { queryApi } from "@repo/orpc/query"
import { BarChartIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { lazy, Suspense, useEffect, useReducer } from "react"
import { Shimmer } from "shimmer-from-structure"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import TimeRangeToggle, {
  type TimeRange,
} from "@/components/monitoring/time-range-toggle"
import WebhookFilterToggle, {
  type EventType,
} from "@/components/monitoring/webhook-filter-toggle"

const WebhookEventsChart = lazy(() => import("@/components/monitoring/webhook-events-chart"))

const WebhookProcessingChart = lazy(() => import("@/components/monitoring/webhook-processing-chart"))

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

interface MetricsState {
  eventType: EventType
  timeRange: TimeRange
  webhookMetrics: MetricsData | null
  webhookLoading: boolean
  webhookError: string | null
}

type MetricsAction =
  | { type: "SET_EVENT_TYPE"; payload: EventType }
  | { type: "SET_TIME_RANGE"; payload: TimeRange }
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: MetricsData }
  | { type: "FETCH_ERROR"; payload: string }

const initialMetricsState: MetricsState = {
  eventType: "all",
  timeRange: "24h",
  webhookMetrics: null,
  webhookLoading: true,
  webhookError: null,
}

const metricsReducer = (
  state: MetricsState,
  action: MetricsAction,
): MetricsState => {
  switch (action.type) {
    case "SET_EVENT_TYPE":
      return { ...state, eventType: action.payload }
    case "SET_TIME_RANGE":
      return { ...state, timeRange: action.payload }
    case "FETCH_START":
      return { ...state, webhookLoading: true, webhookError: null }
    case "FETCH_SUCCESS":
      return { ...state, webhookLoading: false, webhookMetrics: action.payload }
    case "FETCH_ERROR":
      return { ...state, webhookLoading: false, webhookError: action.payload }
    default:
      return state
  }
}

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "Webhooks" },
]

const WebhooksPage = () => {
  const [
    { eventType, timeRange, webhookMetrics, webhookLoading, webhookError },
    dispatch,
  ] = useReducer(metricsReducer, initialMetricsState)

  useEffect(() => {
    let cancelled = false
    const loadMetrics = async () => {
      dispatch({ type: "FETCH_START" })
      const eventTypeParam = eventType === "all" ? undefined : eventType
      try {
        const result = await queryApi.admin.getWebhookMetricsHistory.call({
          eventType: eventTypeParam,
          timeRange,
        })
        if (!cancelled) {
          dispatch({ type: "FETCH_SUCCESS", payload: result })
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: "FETCH_ERROR",
            payload: err instanceof Error ? err.message : "Failed to load metrics",
          })
        }
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
        title="Webhook Monitoring"
        description="Polar webhook processing metrics and performance"
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm font-medium">Event Type:</div>
          <WebhookFilterToggle
            value={eventType}
            onChange={(v) => dispatch({ type: "SET_EVENT_TYPE", payload: v })}
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="text-sm font-medium">Time Range:</div>
          <TimeRangeToggle
            value={timeRange}
            onChange={(v) => dispatch({ type: "SET_TIME_RANGE", payload: v })}
          />
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
                change={{ value: "", trend: "up" }}
                icon={<CheckCircleIcon className="size-4.5" />}
                loading={webhookLoading}
              />
              <StatsCard
                title="Failure Count"
                value={(
                  webhookMetrics?.summary.failureCount ?? 0
                ).toLocaleString()}
                change={{ value: "", trend: "down" }}
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
            <Suspense fallback={<div className="bg-muted h-96 animate-pulse rounded-md" />}>
              <WebhookEventsChart data={webhookMetrics?.dataPoints ?? []} />
            </Suspense>
            <Suspense fallback={<div className="bg-muted h-96 animate-pulse rounded-md" />}>
              <WebhookProcessingChart data={webhookMetrics?.dataPoints ?? []} />
            </Suspense>
          </div>
        </>
      )}
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/webhooks")({
  component: WebhooksPage,
})
