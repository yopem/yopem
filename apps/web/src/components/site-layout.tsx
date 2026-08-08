"use client"

import type { ReactNode } from "react"

import { Link, useNavigate, useRouteContext } from "@tanstack/react-router"
import { useState } from "react"

import { adminUrl } from "env"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { Logo } from "ui/logo"
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "ui/menu"
import { ThemeSwitcher } from "ui/theme-switcher"

import { HeaderSearch } from "@/components/header-search"
import { loginFn, logoutFn } from "@/lib/auth"

export function SiteLayout({ children }: { children: ReactNode }) {
  const { session } = useRouteContext({ from: "__root__" })
  const [imageError, setImageError] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    const res = await loginFn({ data: { returnTo: "/" } })
    if (res.redirectTo) {
      window.location.href = res.redirectTo
    }
  }

  const handleLogout = async () => {
    const res = await logoutFn()
    if (res.redirectTo) {
      void navigate({ to: res.redirectTo })
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col font-sans antialiased">
      {/* Header matching yopem-old */}
      <header className="bg-card/80 supports-backdrop-filter:bg-card/60 border-border sticky top-0 z-50 w-full border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4">
          <Link to="/">
            <div className="hover:bg-accent mr-8 flex items-center gap-1 rounded-sm p-2">
              <div className="text-card-foreground flex size-6 items-center justify-center overflow-hidden rounded-sm">
                <Logo className="size-full p-0.5" />
              </div>
              <h2 className="text-foreground text-lg/tight font-bold tracking-tight">
                Yopem
              </h2>
            </div>
          </Link>

          <HeaderSearch />

          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-3">
              <Link
                to="/products"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Products
              </Link>
              {session ? (
                <Menu>
                  <MenuTrigger
                    render={
                      <button
                        type="button"
                        className="focus-visible:ring-ring group cursor-pointer rounded-full outline-none focus-visible:ring-2"
                      >
                        <div className="group-hover:bg-accent group-data-popup-open:bg-accent rounded-full p-0.5 transition-colors">
                          <Avatar className="size-8">
                            {session.image && !imageError && (
                              <AvatarImage
                                src={session.image}
                                alt={session.name ?? session.email}
                                onError={() => setImageError(true)}
                              />
                            )}
                            <AvatarFallback>
                              {getInitials(session.name, session.email)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </button>
                    }
                  />
                  <MenuPopup align="end" className="w-48">
                    <MenuItem render={<Link to="/products" />}>
                      Products
                    </MenuItem>
                    <MenuItem render={<Link to="/dashboard" />}>
                      Activity
                    </MenuItem>
                    <MenuItem render={<Link to="/dashboard/runs" />}>
                      Logs
                    </MenuItem>
                    <MenuItem render={<Link to="/dashboard/subscription" />}>
                      Subscription
                    </MenuItem>
                    <MenuItem render={<Link to="/dashboard/profile" />}>
                      Settings
                    </MenuItem>
                    {session.role === "admin" && adminUrl && (
                      <MenuItem
                        render={
                          <a href={adminUrl} target="_blank" rel="noreferrer">
                            Admin
                          </a>
                        }
                      />
                    )}
                    <MenuItem
                      className="text-destructive cursor-pointer"
                      onClick={() => void handleLogout()}
                    >
                      Logout
                    </MenuItem>
                    <MenuSeparator />
                    <div className="flex justify-center px-2 py-1">
                      <ThemeSwitcher />
                    </div>
                  </MenuPopup>
                </Menu>
              ) : (
                <Button
                  variant="ghost"
                  className="h-9"
                  onClick={() => void handleLogin()}
                >
                  Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1" style={{ viewTransitionName: "main-content" }}>
        {children}
      </main>

      {/* Footer matching yopem-old */}
      <footer className="bg-background border-border w-full border-t py-12 text-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-card flex size-6 items-center justify-center overflow-hidden rounded-sm">
                  <Link to="/">
                    <Logo className="size-full p-0.5" />
                  </Link>
                </div>
                <Link to="/">
                  <h3 className="text-foreground text-lg font-bold">Yopem</h3>
                </Link>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Access powerful AI tools with simple credit-based pricing. No
                subscriptions, no complexity.
              </p>
              <ThemeSwitcher />
            </div>
            <div className="flex gap-4">
              <a
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                href="https://x.com/yopemdotcom"
                rel="noreferrer"
              >
                <span className="sr-only">X</span>
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                href="https://github.com/yopem/yopem"
                rel="noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    fillRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="text-muted-foreground border-border flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm md:flex-row">
            <p>© {new Date().getFullYear()} Yopem. All rights reserved.</p>
            <div className="flex gap-6">
              <a
                className="hover:text-foreground"
                href="/rpc/doc"
                target="_blank"
                rel="noreferrer"
              >
                API Docs
              </a>
              <a
                className="hover:text-foreground"
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
