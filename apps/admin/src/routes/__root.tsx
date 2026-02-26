import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"

import "@/globals.css"
import "@repo/ui/style.css"

import { siteTitle } from "@repo/env/client"
import { appEnv } from "@repo/env/client"
import { formatError, logger } from "@repo/logger"
import { Button } from "@repo/ui/button"
import {
  AlertCircleIcon,
  HomeIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useEffect } from "react"

import Providers from "@/components/providers"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: `Admin - ${siteTitle}` },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: `${siteTitle} Admin Console` },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#000000",
        media: "(prefers-color-scheme: dark)",
      },
      { name: "color-scheme", content: "light dark" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  )
}

function ErrorComponent({ error, reset }: { error: Error; reset?: () => void }) {
  useEffect(() => {
    logger.error(`Route error: ${formatError(error)}`)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="bg-destructive/10 text-destructive mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
            <AlertCircleIcon className="size-8" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground mb-2 text-sm">
            We encountered an error while loading this page. Please try again or
            return to the homepage.
          </p>
          {appEnv === "development" && (
            <details className="mt-4 rounded-lg border p-4 text-left">
              <summary className="text-muted-foreground cursor-pointer text-xs font-medium">
                Error Details (Development)
              </summary>
              <pre className="text-destructive mt-2 overflow-x-auto text-xs">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {reset && (
            <Button onClick={() => reset()} size="lg">
              <RefreshCwIcon className="size-4" />
              Try again
            </Button>
          )}
          <Link to="/">
            <Button variant="outline" size="lg">
              <HomeIcon className="size-4" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-muted-foreground mt-4 text-lg">Page not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/">
            <Button size="lg">
              <HomeIcon className="size-4" />
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
