import { Outlet, createFileRoute } from "@tanstack/react-router"

const ToolsLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute("/_dashboard/tools")({
  component: ToolsLayout,
})
