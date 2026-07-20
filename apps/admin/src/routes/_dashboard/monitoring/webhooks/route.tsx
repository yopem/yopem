import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BarChartIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import TimeRangeToggle, {
  type TimeRange,
} from "@/components/monitoring/time-range-toggle"
import WebhookFilterToggle, {
  type EventType,
} from "@/components/monitoring/webhook-filter-toggle"

const WebhookEventsChart = lazy(
  () => import("@/components/monitoring/webhook-events-chart"),
)

const WebhookProcessingChart = lazy(
  () => import("@/components/monitoring/webhook-processing-chart"),
)

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "Webhooks" },
]

const WebhooksPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const [eventType, setEventType] = useState<EventType>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("24h")

  const {
    data: webhookMetrics,
    isLoading: webhookLoading,
    error: webhookError,
  } = useQuery({
    ...queryApi.admin.getWebhookMetricsHistory.queryOptions({
      input: {
        eventType: eventType === "all" ? undefined : eventType,
        timeRange,
      },
    }),
  })

  return (
    <HydrateClient state={dehydratedState}>
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />

        <AdminPageHeader
          title="Webhook Monitoring"
          description="Polar webhook processing metrics and performance"
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

        {webhookError ? (
          <div className="text-center text-red-600">
            {webhookError instanceof Error
              ? webhookError.message
              : "Failed to load webhook metrics"}
          </div>
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
              <Suspense
                fallback={
                  <div className="bg-muted h-96 animate-pulse rounded-md" />
                }
              >
                <WebhookEventsChart data={webhookMetrics?.dataPoints ?? []} />
              </Suspense>
              <Suspense
                fallback={
                  <div className="bg-muted h-96 animate-pulse rounded-md" />
                }
              >
                <WebhookProcessingChart
                  data={webhookMetrics?.dataPoints ?? []}
                />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/webhooks")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.admin.getWebhookMetricsHistory.queryOptions({
        input: { eventType: undefined, timeRange: "24h" },
      }),
    ])
    return { dehydratedState }
  },
  component: WebhooksPage,
})
