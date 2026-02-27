import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import {
  ActivityIcon,
  BotIcon,
  FileImageIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TagsIcon,
} from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import AdminLayout from "@/components/layout/admin-layout"
import { getSession } from "@/lib/auth"

const DashboardLoading = () => {
  return (
    <Shimmer loading={true}>
      <div className="bg-muted size-full" />
    </Shimmer>
  )
}

const DashboardLayout = () => {
  const { session } = Route.useRouteContext()

  const navItems = [
    {
      icon: <LayoutDashboardIcon className="size-4.5" />,
      label: "Overview",
      href: "/",
    },
    {
      icon: <BotIcon className="size-4.5" />,
      label: "Tools",
      href: "/tools",
    },
    {
      icon: <FileImageIcon className="size-4.5" />,
      label: "Assets",
      href: "/assets",
    },
    {
      icon: <TagsIcon className="size-4.5" />,
      label: "Categories & Tags",
      href: "/categories-tags",
    },
    {
      icon: <ActivityIcon className="size-4.5" />,
      label: "Monitoring",
      href: "/monitoring",
      subItems: [
        { label: "Overview", href: "/monitoring/overview" },
        { label: "AI Requests", href: "/monitoring/ai-requests" },
        { label: "API Usage", href: "/monitoring/api-usage" },
        { label: "Webhooks", href: "/monitoring/webhooks" },
        { label: "Uptime", href: "/monitoring/uptime" },
        { label: "Activity Logs", href: "/monitoring/activity" },
      ],
    },
    {
      icon: <SettingsIcon className="size-4.5" />,
      label: "Settings",
      href: "/setting",
    },
  ]

  const user = {
    name: session.name!,
    email: session.email,
    image: session.image!,
  }

  return (
    <AdminLayout
      title="Yopem"
      subtitle="Admin Console"
      navItems={navItems}
      user={user}
    >
      <Outlet />
    </AdminLayout>
  )
}

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: "/auth/login" })
    }
    return { session }
  },
  component: DashboardLayout,
  pendingComponent: DashboardLoading,
})
