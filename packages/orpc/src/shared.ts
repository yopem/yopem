import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { logger } from "@repo/logger"
import type { appRouter } from "@repo/server/router"

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env["NEXT_PUBLIC_API_URL"] ?? ""
  }
  return process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000"
}

export const createORPCLink = (
  customFetch?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>,
) => {
  return new RPCLink({
    url: getBaseUrl() + "/rpc",
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
