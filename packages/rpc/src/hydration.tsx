import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query"
import { cache, type ReactNode } from "react"

import { createQueryClient } from "./query-client"

export const getQueryClient = cache(createQueryClient)

export function HydrateClient(props: {
  children: ReactNode
  state: DehydratedState
}) {
  return (
    <HydrationBoundary state={props.state}>{props.children}</HydrationBoundary>
  )
}
