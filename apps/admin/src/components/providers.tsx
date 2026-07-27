"use client"

import type { ReactNode } from "react"

import { ThemeProvider } from "ui/theme-provider"
import { AnchoredToastProvider, ToastProvider } from "ui/toast"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AnchoredToastProvider>{children}</AnchoredToastProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
