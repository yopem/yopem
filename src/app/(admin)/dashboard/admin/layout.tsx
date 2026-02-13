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

import AdminLayout from "@/components/admin/admin-layout"
import { auth } from "@/lib/auth/session"

export default async function AdminDashboardLayout({
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
      label: "Dashboard",
      href: "/dashboard/admin",
    },
    {
      icon: <BotIcon className="size-4.5" />,
      label: "Tools",
      href: "/dashboard/admin/tools",
    },
    {
      icon: <FileImageIcon className="size-4.5" />,
      label: "Assets",
      href: "/dashboard/admin/assets",
    },
    {
      icon: <TagsIcon className="size-4.5" />,
      label: "Categories & Tags",
      href: "/dashboard/admin/categories-tags",
    },
    {
      icon: <ActivityIcon className="size-4.5" />,
      label: "Monitoring",
      href: "/dashboard/admin/monitoring",
    },
    {
      icon: <SettingsIcon className="size-4.5" />,
      label: "Settings",
      href: "/dashboard/admin/setting",
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
