import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import type { appRouter } from "@/lib/api/root"
import { env } from "@/lib/env"
import { logger } from "@/lib/utils/logger"

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env["APP_ENV"] === "development") {
    return "http://localhost:3000"
  }
  return env.NEXT_PUBLIC_API_URL
}

export const createORPCLink = (
  customFetch?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => {
  return new RPCLink({
    url: getBaseUrl() + "/api/orpc",
    fetch:
      customFetch ??
      ((input, init) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        })
      }),
    interceptors: [
      onError((error) => {
        const isAbortError =
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message === "signal is aborted without reason")
        if (isAbortError) {
          logger.info("Fetch aborted as expected")
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          logger.error(errorMessage)
        }
      }),
    ],
  })
}

export const createORPCClientFromLink = (
  link: ReturnType<typeof createORPCLink>,
): RouterClient<typeof appRouter> => {
  return createORPCClient(link)
}
