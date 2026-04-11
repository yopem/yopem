"use client"

import { Link } from "@tanstack/react-router"
import { useState } from "react"

import type { SessionUser } from "auth/types"
import { adminUrl } from "env/client"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import Logo from "ui/logo"
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "ui/menu"
import ThemeSwitcher from "ui/theme-switcher"

import HeaderSearch from "@/components/navigation/header-search"
import { loginFn, logoutFn } from "@/lib/auth"

interface HeaderProps {
  session: SessionUser | false
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

const Header = ({ session }: HeaderProps) => {
  const [imageError, setImageError] = useState(false)

  const handleLogin = async () => {
    try {
      await loginFn()
    } catch (error) {
      if (error && typeof error === "object") {
        const err = error as {
          status?: number
          href?: string
          options?: { href?: string }
        }
        if (err.status === 307) {
          const redirectUrl = err.href || err.options?.href
          if (redirectUrl) {
            window.location.href = redirectUrl
            return
          }
        }
      }
      throw error
    }
  }

  return (
    <div className="bg-card/80 supports-backdrop-filter:bg-card/60 border-border sticky top-0 z-50 w-full border-b backdrop-blur-sm">
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
          <nav className="flex items-center space-x-2">
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
                  {session.role === "admin" && (
                    <MenuItem render={<a href={adminUrl}>Admin</a>} />
                  )}
                  <MenuItem
                    className="text-destructive"
                    onClick={() => logoutFn()}
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
              <Button variant="ghost" className="h-9" onClick={handleLogin}>
                Login
              </Button>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Header
