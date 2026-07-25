import type { apiApp } from "server/router"

import { hc } from "hono/client"

export type ApiApp = typeof apiApp
export type ApiClient = ReturnType<typeof createApiClient>

export const createApiClient = (baseUrl: string) => {
  return hc<ApiApp>(baseUrl)
}
