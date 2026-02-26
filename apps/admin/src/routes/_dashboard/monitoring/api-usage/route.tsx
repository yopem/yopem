import { createFileRoute } from "@tanstack/react-router"
import { BarChartIcon, DollarSignIcon, KeyIcon } from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import { useApiKeyStats } from "@/hooks/use-api-keys"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "API Usage" },
]

const ApiUsagePage = () => {
  const { data: apiKeyStats, isLoading: apiKeyLoading } = useApiKeyStats()

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="API Usage"
        description="API key utilization and cost metrics"
      />

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
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/api-usage")({
  component: ApiUsagePage,
})
