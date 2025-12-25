"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"

interface ThemeProviderProps {
  children: React.ReactNode
}

const ThemeProvider = (props: ThemeProviderProps) => {
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

export default ThemeProvider
