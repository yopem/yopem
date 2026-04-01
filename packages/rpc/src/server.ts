import { Result } from "better-result"

import { formatError, logger } from "logger"

import { createORPCClientFromLink, createORPCLink } from "./shared.ts"

const createServerFetchWithCookies = () => {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const fetchInit = { ...init }

    const headersResult = await Result.tryPromise({
      try: async () => {
        const { getRequestHeaders } =
          await import("@tanstack/react-start/server")
        const allHeaders = getRequestHeaders()
        const cookieHeader = allHeaders.get("cookie")

        if (cookieHeader) {
          fetchInit.headers = {
            ...(fetchInit.headers as Record<string, string>),
            cookie: cookieHeader,
          }
        }
        return fetchInit
      },
      catch: (error) => {
        logger.error(
          `Could not access headers in server context: ${formatError(error)}`,
        )
        return fetchInit
      },
    })

    return fetch(input, {
      ...(headersResult.isOk() ? headersResult.value : fetchInit),
      credentials: "include",
    })
  }
}

export const serverApi = createORPCClientFromLink(
  createORPCLink(createServerFetchWithCookies()),
)
