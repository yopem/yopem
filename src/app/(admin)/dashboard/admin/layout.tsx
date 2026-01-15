import { type ReactNode } from "react"
import { redirect } from "next/navigation"
import {
  ActivityIcon,
  BotIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from "lucide-react"

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
      icon: <LayoutDashboardIcon className="size-[18px]" />,
      label: "Dashboard",
      href: "/dashboard/admin",
    },
    {
      icon: <BotIcon className="size-[18px]" />,
      label: "Tools",
      href: "/dashboard/admin/tools",
    },
    {
      icon: <ActivityIcon className="size-[18px]" />,
      label: "Monitoring",
      href: "/dashboard/admin/monitoring",
    },
    {
      icon: <SettingsIcon className="size-[18px]" />,
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
