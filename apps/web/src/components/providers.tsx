"use client"

import type { ReactNode } from "react"

import { QueryProvider } from "~orpc/provider"
import ThemeProvider from "~ui/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "~ui/toast"

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
