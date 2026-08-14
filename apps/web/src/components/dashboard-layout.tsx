"use client"

import type { ReactNode } from "react"

import {
  Link,
  useLocation,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router"
import {
  ChevronUpIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  UserIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { useState } from "react"

import { Logo } from "ui/logo"
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "ui/menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from "ui/sidebar"
import { ThemeSwitcher } from "ui/theme-switcher"

import { SessionAvatar } from "@/components/session-avatar"
import { logoutFn } from "@/lib/auth"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Products", href: "/dashboard/products", icon: LayoutGridIcon },
  { label: "My Runs", href: "/dashboard/runs", icon: ZapIcon },
  { label: "Subscription", href: "/dashboard/subscription", icon: WalletIcon },
  { label: "Profile", href: "/dashboard/profile", icon: UserIcon },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session } = useRouteContext({ from: "__root__" })
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const res = await logoutFn()
      if (res?.redirectTo) {
        void navigate({ to: res.redirectTo })
      }
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white text-black">
              <Link to="/">
                <Logo className="size-5" />
              </Link>
            </div>
            <div className="flex flex-col">
              <Link to="/">
                <h1 className="text-sidebar-foreground text-lg leading-none font-bold tracking-tight">
                  Yopem
                </h1>
              </Link>
              <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-wider uppercase">
                Dashboard
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-6">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      isActive
                        ? ""
                        : "group-hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-sidebar-border space-y-3 border-t p-4">
          <div className="flex items-center justify-center">
            <ThemeSwitcher />
          </div>

          {session && (
            <Menu>
              <MenuTrigger
                render={
                  <button
                    type="button"
                    className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors outline-none focus-visible:ring-2"
                  >
                    <SessionAvatar
                      name={session.name}
                      email={session.email}
                      image={session.image}
                      className="size-8 shrink-0"
                      fallbackClassName="text-xs font-bold"
                    />
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <p className="text-sidebar-foreground truncate text-sm font-medium">
                        {session.name ?? session.email}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {session.email}
                      </p>
                    </div>
                    <ChevronUpIcon className="text-muted-foreground size-4 shrink-0" />
                  </button>
                }
              />
              <MenuPopup
                side="top"
                align="end"
                sideOffset={8}
                className="min-w-56"
              >
                <MenuItem render={<Link to="/" />}>
                  <HomeIcon className="mr-2 size-4" />
                  <span>Home</span>
                </MenuItem>
                <MenuItem render={<Link to="/products" />}>
                  <ZapIcon className="mr-2 size-4" />
                  <span>Products</span>
                </MenuItem>
                <MenuItem render={<Link to="/dashboard/profile" />}>
                  <UserIcon className="mr-2 size-4" />
                  <span>Profile</span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  onClick={() => void handleLogout()}
                  variant="destructive"
                  disabled={isLoggingOut}
                >
                  <LogOutIcon className="mr-2 size-4" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </MenuItem>
              </MenuPopup>
            </Menu>
          )}
        </SidebarFooter>
      </Sidebar>

      <main
        className="flex flex-1 flex-col overflow-hidden"
        style={{ viewTransitionName: "main-content" }}
      >
        {children}
      </main>
    </SidebarProvider>
  )
}
