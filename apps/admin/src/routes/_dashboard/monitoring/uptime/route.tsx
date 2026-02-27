import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"

import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import UptimeStats from "@/components/monitoring/uptime-stats"

const UptimeChart = lazy(() => import("@/components/monitoring/uptime-chart"))

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
        <Suspense
          fallback={<div className="bg-muted h-96 animate-pulse rounded-md" />}
        >
          <UptimeChart />
        </Suspense>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/uptime")({
  component: UptimePage,
})
