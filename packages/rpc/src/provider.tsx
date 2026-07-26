"use client"

import type { ReactNode } from "react"

import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { createQueryClient } from "./query-client"

export function RPCProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
