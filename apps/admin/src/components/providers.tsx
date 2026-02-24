"use client"

import type { ReactNode } from "react"

import { QueryProvider } from "@repo/orpc/provider"
import ThemeProvider from "@repo/ui/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "@repo/ui/toast"

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
