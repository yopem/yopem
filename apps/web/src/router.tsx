import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

import { getQueryClient } from "rpc/query-client"

import { getSession } from "@/lib/auth"
import { parseSearch, stringifySearch } from "@/lib/search-serializer"

import { routeTree } from "./routeTree.gen"

export async function getRouter() {
  const queryClient = getQueryClient()
  const session = await getSession()

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, session: session || null },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    stringifySearch,
    parseSearch,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
