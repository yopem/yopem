import type { RouterClient } from "@orpc/server"
import type { appRouter } from "server/router"

import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"

import { apiUrl } from "env"

// Browser: use relative path to avoid CORS preflight issues with Hono dev server
// Server (SSR): use validated env URL for correct resolution
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "/rpc"
  }
  return `${apiUrl}/rpc`
}

export const createORPCLink = (
  customFetch?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => {
  return new RPCLink({
    url: getBaseUrl(),
    fetch:
      customFetch ??
      ((input, init) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        })
      }),
    headers: () => ({
      Accept: "application/json",
    }),
    interceptors: [
      onError((error) => {
        const isAbortError =
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message === "signal is aborted without reason")
        if (isAbortError) {
          console.info("Fetch aborted as expected")
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          console.error(errorMessage)
        }
        throw error
      }),
    ],
  })
}

export const createORPCClientFromLink = (
  link: ReturnType<typeof createORPCLink>,
): RouterClient<typeof appRouter> => {
  return createORPCClient(link)
}
