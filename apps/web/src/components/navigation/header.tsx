"use client"

import { adminUrl } from "@repo/env/client"
import type { SessionUser } from "@repo/auth/types"
import { Button } from "@repo/ui/button"
import Logo from "@repo/ui/logo"
import { Link } from "@tanstack/react-router"

import { loginFn } from "@/lib/auth"

interface HeaderProps {
  session: SessionUser | false
}

const Header = ({ session }: HeaderProps) => {
  const handleLogin = async () => {
    await loginFn()
  }

  return (
    <div className="bg-card/80 supports-backdrop-filter:bg-card/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4">
        <div className="mr-8 flex items-center gap-2">
          <div className="bg-card text-card-foreground flex size-6 items-center justify-center overflow-hidden rounded-sm">
            <Link to="/">
              <Logo className="size-full p-0.5" />
            </Link>
          </div>
          <Link to="/">
            <h2 className="text-foreground text-lg/tight font-bold tracking-tight">
              Yopem
            </h2>
          </Link>
        </div>
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          <Link
            className="text-muted-foreground hover:text-foreground/80 transition-colors"
            to="/marketplace"
          >
            Marketplace
          </Link>
          {session && (
            <Link
              className="text-muted-foreground hover:text-foreground/80 transition-colors"
              to="/dashboard"
            >
              Dashboard
            </Link>
          )}
          {session && session.role === "admin" && adminUrl && (
            <a
              className="text-muted-foreground hover:text-foreground/80 transition-colors"
              href={adminUrl}
            >
              Admin
            </a>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {session ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="h-9">
                  {session.name ?? session.email}
                </Button>
              </Link>
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
