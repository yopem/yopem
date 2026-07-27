import { Link } from "@tanstack/react-router"
import { HomeIcon } from "lucide-react"

import { Button } from "ui/button"

export function NotFound() {
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
