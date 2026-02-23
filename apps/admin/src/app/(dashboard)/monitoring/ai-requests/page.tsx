"use client"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import AiRequestsChart from "@/components/admin/ai-requests-chart"
import { useSystemMetrics } from "@/hooks/use-system-metrics"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "AI Requests" },
]

const AiRequestsPage = () => {
  const { data: systemMetrics } = useSystemMetrics()

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="AI Requests History"
        description="Token usage and AI request volume over time"
      />

      <AiRequestsChart totalRequests={systemMetrics?.aiRequests ?? 0} />
    </div>
  )
}

export default AiRequestsPage
