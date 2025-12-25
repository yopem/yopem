import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import type { appRouter } from "@/lib/api/root"

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env["PORT"] ?? 3000}`
}

const link = new RPCLink({
  url: getBaseUrl() + "/api/orpc",
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

export const orpcClient: RouterClient<typeof appRouter> = createORPCClient(link)
