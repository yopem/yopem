"use client"

import { Button } from "@repo/ui/button"
import {
  BadgeCheckIcon,
  DollarSignIcon,
  KeyIcon,
  PlusIcon,
  ServerIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import ActivityFeed from "@/components/admin/activity-feed"
import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import AiRequestsChart from "@/components/admin/ai-requests-chart"
import StatsCard from "@/components/admin/stats-card"
import Link from "@/components/link"
import { useActivityFeed } from "@/hooks/use-activity-feed"
import { useSystemMetrics } from "@/hooks/use-system-metrics"

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

export default function AdminDashboardPage() {
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Dashboard" }]

  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics()
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeed()

  const activityItems =
    activityFeed?.map((activity) => ({
      icon:
        activity.type === "payment" ? (
          <BadgeCheckIcon className="text-foreground size-4" />
        ) : (
          <KeyIcon className="text-foreground size-4" />
        ),
      message: activity.message,
      timestamp: new Date(activity.timestamp).toLocaleString(),
    })) ?? []

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="Overview"
        description="Welcome back, Admin. System status is operational."
        action={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold tracking-tight shadow-sm transition-colors"
            render={
              <Link href="/tools/add">
                <PlusIcon className="size-4.5" />
                <span>Add New Tool</span>
              </Link>
            }
          />
        }
      />

      <Shimmer loading={metricsLoading}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(metrics?.revenue ?? 0)}
            change={{
              value: metrics?.revenueChange ?? "N/A",
              trend: metrics?.revenueChange?.startsWith("+")
                ? "up"
                : metrics?.revenueChange?.startsWith("-")
                  ? "down"
                  : "neutral",
            }}
            icon={<DollarSignIcon className="size-4.5" />}
            loading={metricsLoading}
          />
          <StatsCard
            title="Active Users"
            value={formatNumber(metrics?.activeUsers ?? 0)}
            change={{
              value: metrics?.activeUsersChange ?? "N/A",
              trend: metrics?.activeUsersChange?.startsWith("+")
                ? "up"
                : metrics?.activeUsersChange?.startsWith("-")
                  ? "down"
                  : "neutral",
            }}
            icon={<UsersIcon className="size-4.5" />}
            loading={metricsLoading}
          />
          <StatsCard
            title="AI Requests"
            value={formatNumber(metrics?.aiRequests ?? 0)}
            change={{
              value: metrics?.aiRequestsChange ?? "N/A",
              trend: metrics?.aiRequestsChange?.startsWith("+")
                ? "up"
                : metrics?.aiRequestsChange?.startsWith("-")
                  ? "down"
                  : "neutral",
            }}
            icon={<ZapIcon className="size-4.5" />}
            loading={metricsLoading}
          />
          <StatsCard
            title="System Uptime"
            value={metrics?.systemUptime ?? "0.0%"}
            change={{
              value: metrics?.systemUptimeChange ?? "Stable",
              trend: "neutral",
            }}
            icon={<ServerIcon className="size-4.5" />}
            loading={metricsLoading}
          />
        </div>
      </Shimmer>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AiRequestsChart totalRequests={metrics?.aiRequests ?? 0} />
        </div>
        <div className="lg:col-span-1">
          <Shimmer loading={activityLoading}>
            <ActivityFeed items={activityItems} />
          </Shimmer>
        </div>
      </div>
    </div>
  )
}
