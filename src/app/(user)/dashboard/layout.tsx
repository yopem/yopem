import { type ReactNode } from "react"
import { redirect } from "next/navigation"
import {
  CreditCard as CreditCardIcon,
  LayoutDashboard as DashboardIcon,
  Play as PlayIcon,
  User as UserIcon,
} from "lucide-react"

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
      icon: <DashboardIcon className="size-[18px]" />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <UserIcon className="size-[18px]" />,
      label: "Profile",
      href: "/dashboard/profile",
    },
    {
      icon: <PlayIcon className="size-[18px]" />,
      label: "My Runs",
      href: "/dashboard/runs",
    },
    {
      icon: <CreditCardIcon className="size-[18px]" />,
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
