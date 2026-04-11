import type { RouterClient } from "@orpc/server"
import type { appRouter } from "server/router"

import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env["PUBLIC_API_URL"] ?? ""
  }
  return process.env["PUBLIC_API_URL"] ?? "http://localhost:4000"
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
          console.info("Fetch aborted as expected")
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          console.error(errorMessage)
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
