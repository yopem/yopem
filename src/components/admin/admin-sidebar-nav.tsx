"use client"

import { type ReactNode } from "react"

import Link from "@/components/link"

interface NavItem {
  icon: ReactNode
  label: string
  href: string
  active?: boolean
}

interface AdminSidebarNavProps {
  items: NavItem[]
}

const AdminSidebarNav = ({ items }: AdminSidebarNavProps) => {
  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
            item.active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : `text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`
          }`}
        >
          <span
            className={`transition-colors ${
              item.active ? "" : `group-hover:text-sidebar-accent-foreground`
            }`}
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default AdminSidebarNav
