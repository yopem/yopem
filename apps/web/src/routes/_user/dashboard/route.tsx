import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  PlayIcon,
  UserIcon,
} from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import UserLayout from "@/components/user/user-layout"
import { getSession } from "@/lib/auth"

function DashboardLoading() {
  return (
    <Shimmer loading={true}>
      <div className="bg-muted size-full" />
    </Shimmer>
  )
}

export const Route = createFileRoute("/_user/dashboard")({
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

function DashboardLayout() {
  const { session } = Route.useRouteContext()

  const navItems = [
    {
      icon: <LayoutDashboardIcon className="size-4.5" />,
      label: "Overview",
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
      <Outlet />
    </UserLayout>
  )
}
