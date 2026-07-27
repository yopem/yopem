"use client"

import type { ReactNode } from "react"

import { ThemeProvider as NextThemeProvider } from "next-themes"

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider(props: ThemeProviderProps) {
  const { children } = props

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
}
