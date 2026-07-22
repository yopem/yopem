import type { RouterClient } from "@orpc/server"
import type { appRouter } from "server/router"

import { createORPCClient, onError } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"

import { apiUrl } from "env"

// Browser: use absolute same-origin URL to avoid CORS preflight and keep URL construction valid
// Server (SSR): use validated env URL for correct resolution
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/rpc`
  }
  const base = apiUrl?.replace(/\/$/, "")
  if (!base) {
    throw new Error(
      "PUBLIC_API_URL is not set. Check your .env file or run with `vp run with-env ...`.",
    )
  }
  try {
    new URL(`${base}/rpc`)
  } catch (e) {
    throw new Error(
      `PUBLIC_API_URL is not a valid URL: ${JSON.stringify(base)}. ${e instanceof Error ? e.message : String(e)}`,
    )
  }
  return `${base}/rpc`
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
