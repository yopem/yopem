import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import {
  BotIcon,
  FileImageIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TagsIcon,
} from "lucide-react"

import { Layout } from "@/components/layout/layout"

export const Route = createFileRoute("/(admin-console)")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/auth/login" })
    }
    return { session: context.session }
  },
  component: AdminConsoleLayoutComponent,
})

function AdminConsoleLayoutComponent() {
  const { session } = Route.useRouteContext()

  const navItems = [
    {
      icon: <LayoutDashboardIcon className="size-4.5" />,
      label: "Overview",
      href: "/",
    },
    {
      icon: <BotIcon className="size-4.5" />,
      label: "Products",
      href: "/products",
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
      icon: <SettingsIcon className="size-4.5" />,
      label: "Settings",
      href: "/setting",
    },
  ]

  const user = {
    name: session.name ?? session.email,
    email: session.email,
    avatar: session.image ?? undefined,
  }

  return (
    <Layout
      title="Yopem"
      subtitle="Admin Console"
      navItems={navItems}
      user={user}
    >
      <Outlet />
    </Layout>
  )
}
