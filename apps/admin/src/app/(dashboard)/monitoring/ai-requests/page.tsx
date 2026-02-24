"use client"

import AiRequestsChart from "@/components/dashboard/ai-requests-chart"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
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
