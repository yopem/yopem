"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "./button"

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div className="bg-muted/50 inline-flex items-center gap-0.5 rounded-md border p-0.5">
        <div className="size-7" />
        <div className="size-7" />
        <div className="size-7" />
      </div>
    )
  }

  const themes = [
    { name: "light", icon: SunIcon, label: "Light" },
    { name: "dark", icon: MoonIcon, label: "Dark" },
    { name: "system", icon: MonitorIcon, label: "System" },
  ]

  return (
    <div className="bg-muted/50 inline-flex items-center gap-0.5 rounded-md border p-0.5">
      {themes.map(({ name, icon: Icon, label }) => (
        <Button
          key={name}
          variant="ghost"
          size="sm"
          className={`size-7 p-0 ${
            theme === name
              ? "bg-background shadow-sm"
              : "hover:bg-background/50"
          }`}
          onClick={() => setTheme(name)}
          aria-label={`${label} theme`}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  )
}

export default ThemeSwitcher
