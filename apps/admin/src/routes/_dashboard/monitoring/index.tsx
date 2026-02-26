import { createFileRoute } from "@tanstack/react-router"
import {
  ActivityIcon,
  BarChartIcon,
  ClockIcon,
  ServerIcon,
  WebhookIcon,
  ZapIcon,
} from "lucide-react"

import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import Link from "@/components/link"

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Monitoring" }]

const monitoringLinks = [
  {
    href: "/monitoring/overview",
    title: "System Overview",
    description: "Key platform metrics and performance indicators",
    icon: ServerIcon,
  },
  {
    href: "/monitoring/ai-requests",
    title: "AI Requests",
    description: "Token usage and AI request volume over time",
    icon: ZapIcon,
  },
  {
    href: "/monitoring/api-usage",
    title: "API Usage",
    description: "API key utilization and cost metrics",
    icon: BarChartIcon,
  },
  {
    href: "/monitoring/webhooks",
    title: "Webhook Monitoring",
    description: "Polar webhook processing metrics and performance",
    icon: WebhookIcon,
  },
  {
    href: "/monitoring/uptime",
    title: "System Uptime",
    description: "Platform availability and downtime metrics",
    icon: ClockIcon,
  },
  {
    href: "/monitoring/activity",
    title: "Activity Logs",
    description: "System events and operational activity",
    icon: ActivityIcon,
  },
]

const MonitoringIndexPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <AdminBreadcrumb items={breadcrumbItems} />

      <AdminPageHeader
        title="System Monitoring"
        description="Complete platform health and performance metrics"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {monitoringLinks.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="border-border bg-card hover:bg-accent flex flex-col gap-3 rounded-lg border p-6 transition-colors"
          >
            <div className="bg-muted flex size-10 items-center justify-center rounded-md">
              <Icon className="text-muted-foreground size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-foreground font-semibold">{title}</span>
              <span className="text-muted-foreground text-sm">
                {description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute("/_dashboard/monitoring/")({
  component: MonitoringIndexPage,
})
