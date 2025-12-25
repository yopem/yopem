"use client"

import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" className="size-10 cursor-pointer px-0">
        <div className="size-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      className="size-10 cursor-pointer px-0"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <SunIcon className="transition-all" />
      ) : (
        <MoonIcon className="transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeSwitcher
