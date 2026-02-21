"use client"

import { QueryProvider } from "@repo/query/provider"
import ThemeProvider from "@repo/ui/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "@repo/ui/toast"
import type { ReactNode } from "react"

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
