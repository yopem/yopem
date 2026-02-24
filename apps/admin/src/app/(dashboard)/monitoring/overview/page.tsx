"use client"

import { DollarSignIcon, ServerIcon, UsersIcon, ZapIcon } from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import { useSystemMetrics } from "@/hooks/use-system-metrics"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "System Overview" },
]

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

const OverviewPage = () => {
  const { data: systemMetrics, isLoading: systemLoading } = useSystemMetrics()

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="System Overview"
        description="Key platform metrics and performance indicators"
      />

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
            value={systemMetrics?.systemUptime ?? "0.0%"}
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
    </div>
  )
}

export default OverviewPage
