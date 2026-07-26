import { Link } from "@tanstack/react-router"
import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from "lucide-react"
import { useEffect } from "react"

import { Button } from "ui/button"

const GlobalError = ({
  error,
  reset,
}: {
  error: Error
  reset?: () => void
}) => {
  const formatError = (error: unknown): string =>
    error instanceof Error ? (error.stack ?? error.message) : String(error)

  useEffect(() => {
    console.error(`Route error: ${formatError(error)}`)
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
          {import.meta.env.DEV && (
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

export default GlobalError
