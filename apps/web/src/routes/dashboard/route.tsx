import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { DashboardLayout } from "@/components/dashboard-layout"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login", search: { returnTo: "/dashboard" } })
    }
  },
  component: DashboardRouteComponent,
})

function DashboardRouteComponent() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
