"use client"

import Link from "@repo/ui/link"
import { ChevronRightIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { type ReactNode, useState } from "react"

interface NavSubItem {
  label: string
  href: string
}

interface NavItem {
  icon: ReactNode
  label: string
  href: string
  subItems?: NavSubItem[]
}

interface AdminSidebarNavProps {
  items: NavItem[]
}

const AdminSidebarNav = ({ items }: AdminSidebarNavProps) => {
  const pathname = usePathname()

  const isItemActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/")

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.subItems && isItemActive(item.href)) {
        initial[item.href] = true
      }
    }
    return initial
  })

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const hasSubItems = item.subItems && item.subItems.length > 0
        const isActive = isItemActive(item.href)
        const isExpanded = expanded[item.href] ?? false

        return (
          <div key={item.href}>
            {hasSubItems ? (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [item.href]: !prev[item.href],
                  }))
                }
                className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <span
                  className={`transition-colors ${isActive ? "" : "group-hover:text-sidebar-accent-foreground"}`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRightIcon
                  className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            ) : (
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <span
                  className={`transition-colors ${isActive ? "" : "group-hover:text-sidebar-accent-foreground"}`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )}

            {hasSubItems && isExpanded && (
              <div className="border-sidebar-border mt-0.5 ml-9 flex flex-col gap-0.5 border-l pl-3">
                {item.subItems!.map((sub) => {
                  const isSubActive = pathname === sub.href
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`rounded-md px-2 py-1.5 text-sm transition-all ${
                        isSubActive
                          ? "text-sidebar-accent-foreground font-medium"
                          : "text-muted-foreground hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default AdminSidebarNav
