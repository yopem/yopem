import type { ReactNode } from "react"

import { HydrationBoundary } from "@tanstack/react-query"

export { HydrationBoundary }
export type RPCHydrationState = Parameters<typeof HydrationBoundary>[0]["state"]

export function RPCHydrationBoundary({
  state,
  children,
}: {
  state: RPCHydrationState
  children: ReactNode
}) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>
}
