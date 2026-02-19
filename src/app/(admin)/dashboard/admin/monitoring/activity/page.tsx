"use client"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import ActivityLogsList from "@/components/admin/monitoring/activity-logs-list"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard/admin" },
  { label: "Monitoring", href: "/dashboard/admin/monitoring" },
  { label: "Activity" },
]

export default function ActivityPage() {
  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="Activity Logs"
        description="View all system events and operational activity"
      />

      <ActivityLogsList />
    </div>
  )
}
