import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { Loader2Icon, LogInIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"

import { SiteLayout } from "@/components/site-layout"
import { loginFn } from "@/lib/auth"

export interface LoginSearch {
  returnTo?: string
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
  }),
  component: LoginComponent,
})

function LoginComponent() {
  const search = useSearch({ from: "/login" })
  const navigate = useNavigate({ from: "/login" })
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await loginFn({ data: { returnTo: search.returnTo ?? "/" } })
      if (res.redirectTo) {
        if (
          res.redirectTo.startsWith("http://") ||
          res.redirectTo.startsWith("https://")
        ) {
          window.location.href = res.redirectTo
        } else {
          void navigate({ to: res.redirectTo })
        }
      }
    } catch (err) {
      console.error("Login failed:", err)
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="border-border bg-card flex flex-col items-center justify-center space-y-6 rounded-lg border p-8 text-center shadow-2xs">
          <div className="bg-muted text-foreground rounded-full p-3">
            <SparklesIcon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-xl font-bold tracking-tight">
              Sign in to Yopem
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Access your tools, execute workflows, and manage your account.
            </p>
          </div>

          <Button
            size="default"
            className="w-full gap-2 font-medium"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <LogInIcon className="size-4" />
            )}
            <span>{loading ? "Redirecting..." : "Continue with OpenAuth"}</span>
          </Button>
        </div>
      </div>
    </SiteLayout>
  )
}
