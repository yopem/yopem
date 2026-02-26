import { Outlet, createFileRoute } from "@tanstack/react-router"

const MonitoringLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute("/_dashboard/monitoring")({
  component: MonitoringLayout,
})
