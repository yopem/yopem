import { createFileRoute } from "@tanstack/react-router"

import { Forbidden } from "@/components/forbidden"

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenRouteComponent,
})

function ForbiddenRouteComponent() {
  return <Forbidden />
}
