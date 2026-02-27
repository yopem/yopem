import { Skeleton } from "@repo/ui/skeleton"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_user")({
  component: UserLayout,
  pendingComponent: UserPending,
})

function UserLayout() {
  return <Outlet />
}

function UserPending() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
