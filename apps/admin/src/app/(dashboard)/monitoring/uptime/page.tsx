"use client"

import dynamic from "next/dynamic"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import UptimeStats from "@/components/admin/monitoring/uptime-stats"

const UptimeChart = dynamic(
  () => import("@/components/admin/monitoring/uptime-chart"),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-72 animate-pulse rounded-md" />,
  },
)

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "System Uptime" },
]

const UptimePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="System Uptime"
        description="Platform availability and downtime metrics"
      />

      <UptimeStats />
      <div className="mt-4">
        <UptimeChart />
      </div>
    </div>
  )
}

export default UptimePage
