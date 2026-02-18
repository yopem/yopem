"use client"

import {
  ServerIcon,
  ClockIcon,
  AlertTriangleIcon,
  ActivityIcon,
} from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import StatsCard from "@/components/admin/stats-card"
import { useUptimeMetrics } from "@/hooks/use-uptime"
import { formatDateTime } from "@/lib/utils/format-date"

const UptimeStats = () => {
  const { data, isLoading } = useUptimeMetrics()

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <Shimmer loading={isLoading}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Uptime Percentage"
          value={`${data?.uptimePercentage ?? 0}%`}
          change={
            data
              ? {
                  value: "Last 30 days",
                  trend: data.uptimePercentage >= 99 ? "up" : "neutral",
                }
              : undefined
          }
          icon={<ServerIcon className="size-4.5" />}
          loading={isLoading}
        />
        <StatsCard
          title="Total Uptime"
          value={formatDuration(data?.totalDuration ?? 0)}
          icon={<ClockIcon className="size-4.5" />}
          loading={isLoading}
        />
        <StatsCard
          title="Downtime Events"
          value={String(data?.downtimeCount ?? 0)}
          icon={<AlertTriangleIcon className="size-4.5" />}
          loading={isLoading}
        />
        <StatsCard
          title="Last Incident"
          value={
            data?.lastDowntime
              ? formatDateTime(data.lastDowntime)
              : "No incidents"
          }
          icon={<ActivityIcon className="size-4.5" />}
          loading={isLoading}
        />
      </div>
    </Shimmer>
  )
}

export default UptimeStats
