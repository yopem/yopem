"use client"

import { useState } from "react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { httpBatchStreamLink, loggerLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server"
import SuperJSON from "superjson"

import { type AppRouter } from "@/lib/api/root"
import { createQueryClient } from "./query-client"

let clientQueryClientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient()
  }
  clientQueryClientSingleton ??= createQueryClient()

  return clientQueryClientSingleton
}

export const api = createTRPCReact<AppRouter>()

export type RouterInputs = inferRouterInputs<AppRouter>

export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            // eslint-disable-next-line no-restricted-properties
            process.env["APP_ENV"] === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers() {
            const h = new Headers()
            h.set("x-trpc-source", "nextjs-react")

            const headers: Record<string, string> = {}
            h.forEach((value, key) => {
              headers[key] = value
            })
            return headers
          },
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  return "http://localhost:3000"
}
