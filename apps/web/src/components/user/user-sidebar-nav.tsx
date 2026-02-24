"use client"

import Link from "@/components/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
}

interface UserSidebarNavProps {
  items: NavItem[]
}

const UserSidebarNav = ({ items }: UserSidebarNavProps) => {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : `text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`
            }`}
          >
            <span
              className={`transition-colors ${
                isActive ? "" : `group-hover:text-sidebar-accent-foreground`
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default UserSidebarNav
