import { getRequestHeaders } from "@tanstack/react-start/server"

import { createORPCClientFromLink, createORPCLink } from "./shared"

const createServerFetchWithCookies = () => {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const fetchInit = { ...init }

    try {
      const allHeaders = getRequestHeaders()
      const cookieHeader = allHeaders.get("cookie")

      if (cookieHeader) {
        fetchInit.headers = {
          ...(fetchInit.headers as Record<string, string>),
          cookie: cookieHeader,
        }
      }
    } catch (error) {
      console.error(
        `Could not access headers in server context: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    return fetch(input, {
      ...fetchInit,
      credentials: "include",
    })
  }
}

export const serverApi = createORPCClientFromLink(
  createORPCLink(createServerFetchWithCookies()),
)
