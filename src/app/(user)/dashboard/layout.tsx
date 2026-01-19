"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard as CreditCardIcon,
  LayoutDashboard as DashboardIcon,
  Menu as MenuIcon,
  Play as PlayIcon,
  User as UserIcon,
  X as XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { name: "Profile", href: "/dashboard/profile", icon: UserIcon },
  { name: "My Runs", href: "/dashboard/runs", icon: PlayIcon },
  { name: "Credits", href: "/dashboard/credits", icon: CreditCardIcon },
]

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`bg-card fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Dashboard
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="size-5" />
          </Button>
        </div>
        <nav className="space-y-2 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute right-0 bottom-0 left-0 border-t p-4">
          <div className="text-muted-foreground text-sm">User Profile</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center gap-4 border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="size-5" />
          </Button>
          <Link href="/dashboard" className="font-bold">
            Dashboard
          </Link>
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
