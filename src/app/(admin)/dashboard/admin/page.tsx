import { redirect } from "next/navigation"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BadgeCheckIcon,
  BotIcon,
  DollarSignIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  ServerIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

import ActivityFeed from "@/components/admin/activity-feed"
import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminLayout from "@/components/admin/admin-layout"
import AdminPageHeader from "@/components/admin/admin-page-header"
import ChartPlaceholder from "@/components/admin/chart-placeholder"
import StatsCard from "@/components/admin/stats-card"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/session"

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/login")
  }

  // if (session.role !== "admin") {
  //   redirect("/dashboard")
  // }

  const navItems = [
    {
      icon: <LayoutDashboardIcon className="h-[18px] w-[18px]" />,
      label: "Dashboard",
      href: "/dashboard/admin",
      active: true,
    },
    {
      icon: <BotIcon className="h-[18px] w-[18px]" />,
      label: "Tools",
      href: "/dashboard/admin/tools",
    },
    {
      icon: <ActivityIcon className="h-[18px] w-[18px]" />,
      label: "Monitoring",
      href: "/dashboard/admin/monitoring",
    },
    {
      icon: <SettingsIcon className="h-[18px] w-[18px]" />,
      label: "Settings",
      href: "/dashboard/admin/settings",
    },
  ]

  const user = {
    name: session.name!,
    email: session.email,
    image: session.image!,
  }

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Dashboard" }]

  const activityItems = [
    {
      icon: <UserPlusIcon className="text-foreground h-4 w-4" />,
      message: (
        <>
          New user <span className="font-bold">alex_dev</span> joined the
          platform.
        </>
      ),
      timestamp: "2 minutes ago",
    },
    {
      icon: <AlertTriangleIcon className="text-foreground h-4 w-4" />,
      message: (
        <>
          High latency detected on{" "}
          <span className="font-bold">GPT-4-Turbo</span>.
        </>
      ),
      timestamp: "15 minutes ago",
    },
    {
      icon: <KeyIcon className="text-foreground h-4 w-4" />,
      message: (
        <>
          New API Key generated for{" "}
          <span className="font-bold">internal_service</span>.
        </>
      ),
      timestamp: "1 hour ago",
    },
    {
      icon: <BadgeCheckIcon className="text-foreground h-4 w-4" />,
      message: (
        <>
          Subscription upgraded by <span className="font-bold">Studio_B</span>.
        </>
      ),
      timestamp: "3 hours ago",
    },
    {
      icon: <LogOutIcon className="text-foreground h-4 w-4" />,
      message: "Admin session timeout.",
      timestamp: "5 hours ago",
    },
  ]

  return (
    <AdminLayout
      title="Yopem"
      subtitle="Admin Console"
      navItems={navItems}
      user={user}
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />

        <AdminPageHeader
          title="Overview"
          description="Welcome back, Admin. System status is operational."
          action={
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold tracking-tight shadow-sm transition-colors">
              <PlusIcon className="h-[18px] w-[18px]" />
              <span>Add New Tool</span>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value="$12,450.00"
            change={{ value: "+12% vs last month", trend: "up" }}
            icon={<DollarSignIcon className="h-[18px] w-[18px]" />}
          />
          <StatsCard
            title="Active Users"
            value="1,234"
            change={{ value: "+5% vs last month", trend: "up" }}
            icon={<UsersIcon className="h-[18px] w-[18px]" />}
          />
          <StatsCard
            title="AI Requests"
            value="45.2k"
            change={{ value: "+18% vs last month", trend: "up" }}
            icon={<ZapIcon className="h-[18px] w-[18px]" />}
          />
          <StatsCard
            title="System Uptime"
            value="99.9%"
            change={{ value: "Stable", trend: "neutral" }}
            icon={<ServerIcon className="h-[18px] w-[18px]" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartPlaceholder
              title="Token Usage Overview"
              subtitle="45,200 Tokens"
            />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed items={activityItems} />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
