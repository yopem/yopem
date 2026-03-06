"use client"

import type { SessionUser } from "@repo/auth/types"

import { adminUrl } from "@repo/env/client"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import { Button } from "@repo/ui/button"
import Logo from "@repo/ui/logo"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@repo/ui/menu"
import ThemeSwitcher from "@repo/ui/theme-switcher"
import { Link } from "@tanstack/react-router"

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
  const handleLogin = async () => {
    await loginFn()
  }

  return (
    <div className="bg-card/80 supports-backdrop-filter:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
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
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {session ? (
              <Menu>
                <MenuTrigger
                  render={
                    <button
                      type="button"
                      className="focus-visible:ring-ring cursor-pointer rounded-full outline-none focus-visible:ring-2"
                    >
                      <Avatar className="size-8">
                        <AvatarImage
                          src={session.image!}
                          alt={session.name ?? session.email}
                        />
                        <AvatarFallback>
                          {getInitials(session.name, session.email)}
                        </AvatarFallback>
                      </Avatar>
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
                  <MenuItem render={<Link to="/dashboard/credits" />}>
                    Credits
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
