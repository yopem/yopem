import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"

import AiRequestsChart from "@/components/dashboard/ai-requests-chart"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Monitoring", href: "/monitoring" },
  { label: "AI Requests" },
]

const AiRequestsPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const { data: systemMetrics } = useQuery({
    ...queryApi.admin.getSystemMetrics.queryOptions(),
    staleTime: 30 * 1000,
  })

  return (
    <HydrateClient state={dehydratedState}>
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />

        <AdminPageHeader
          title="AI Requests History"
          description="Token usage and AI request volume over time"
        />

        <AiRequestsChart totalRequests={systemMetrics?.aiRequests ?? 0} />
      </div>
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/ai-requests")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.admin.getSystemMetrics.queryOptions(),
      serverQueryApi.admin.getAiRequestsHistory.queryOptions({
        input: { timeRange: "7d" },
      }),
    ])
    return { dehydratedState }
  },
  component: AiRequestsPage,
})
