import type { ReactNode } from "react"

import { Link, useRouteContext } from "@tanstack/react-router"
import { ArrowRightIcon, MenuIcon } from "lucide-react"

import { Button } from "ui/button"
import { Logo } from "ui/logo"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "ui/sheet"
import { ThemeSwitcher } from "ui/theme-switcher"

export function SiteLayout({ children }: { children: ReactNode }) {
  const { session } = useRouteContext({ from: "__root__" })

  const primaryNav = (
    <>
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground [&.active]:text-foreground transition-colors [&.active]:font-semibold"
      >
        Home
      </Link>
      <Link
        to="/products"
        className="text-muted-foreground hover:text-foreground [&.active]:text-foreground transition-colors [&.active]:font-semibold"
      >
        Explore Tools
      </Link>
    </>
  )

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col font-sans antialiased">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-6 w-auto" />
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              {primaryNav}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:inline-flex">
              <ThemeSwitcher />
            </div>

            {session ? (
              <Button size="sm" render={<Link to="/products" />}>
                Explore Tools
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5"
                render={<Link to="/login" />}
              >
                <span>Sign In</span>
                <ArrowRightIcon className="size-3.5" />
              </Button>
            )}

            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open menu"
                  >
                    <MenuIcon className="size-5" />
                  </Button>
                }
              />
              <SheetContent
                side="right"
                className="w-[calc(100%-(--spacing(12)))] max-w-xs"
              >
                <SheetTitle className="sr-only">Site navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Primary navigation and theme settings
                </SheetDescription>

                <div className="flex flex-col gap-6 pt-4">
                  <nav className="flex flex-col gap-4 text-sm font-medium">
                    {primaryNav}
                  </nav>
                  <div className="border-border border-t pt-4">
                    <ThemeSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content container */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-border bg-muted/10 border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2.5">
              <Logo className="h-5 w-auto" />
              <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
                Discover and execute state-of-the-art AI micro-tools and
                automated workflows.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-heading text-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Navigation
                </h4>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>
                    <Link
                      to="/"
                      className="hover:text-foreground transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="hover:text-foreground transition-colors"
                    >
                      All AI Tools
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-heading text-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Resources
                </h4>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>
                    <a
                      href="/rpc/doc"
                      className="hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noreferrer"
                    >
                      API Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="/sitemap.xml"
                      className="hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sitemap
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-border/60 text-muted-foreground mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row">
            <p>© {new Date().getFullYear()} Yopem Inc. All rights reserved.</p>
            <p className="text-muted-foreground/80 text-[11px]">
              Built with TanStack Start & oRPC
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
