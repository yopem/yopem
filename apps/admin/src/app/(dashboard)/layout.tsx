import { auth } from "@repo/auth/session"
import {
  ActivityIcon,
  BotIcon,
  FileImageIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TagsIcon,
} from "lucide-react"
import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import AdminLayout from "@/components/layout/admin-layout"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

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
      {children}
    </AdminLayout>
  )
}
