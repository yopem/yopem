import {
  CreditCardIcon,
  LayoutDashboardIcon,
  PlayIcon,
  UserIcon,
} from "lucide-react"
import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import UserLayout from "@/components/user/user-layout"
import { auth } from "@/lib/auth/session"

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
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <UserIcon className="size-4.5" />,
      label: "Profile",
      href: "/dashboard/profile",
    },
    {
      icon: <PlayIcon className="size-4.5" />,
      label: "My Runs",
      href: "/dashboard/runs",
    },
    {
      icon: <CreditCardIcon className="size-4.5" />,
      label: "Credits",
      href: "/dashboard/credits",
    },
  ]

  const user = {
    name: session.name!,
    email: session.email,
    avatar: session.image!,
  }

  return (
    <UserLayout
      title="Yopem"
      subtitle="User Dashboard"
      navItems={navItems}
      user={user}
    >
      {children}
    </UserLayout>
  )
}
