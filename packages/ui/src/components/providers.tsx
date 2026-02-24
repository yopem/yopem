"use client"

import type { ReactNode } from "react"

import { QueryProvider } from "@repo/orpc/provider"

import ThemeProvider from "./theme-provider"
import { AnchoredToastProvider, ToastProvider } from "./toast"

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <AnchoredToastProvider>{children}</AnchoredToastProvider>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}

export default Providers
