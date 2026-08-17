"use client"

import { LoaderCircleIcon, ShieldAlertIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import { logoutFn } from "@/lib/auth"

export function Forbidden() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const result = await logoutFn()
      if (result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    } catch (error) {
      setIsLoggingOut(false)
      toastManager.add({
        title: "Sign out failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        type: "error",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="bg-destructive/10 text-destructive mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
            <ShieldAlertIcon className="size-8" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight">403</h1>
          <p className="text-muted-foreground mt-4 text-lg">
            You don't have access to this area
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            This admin console is restricted to administrators. Sign in with an
            administrator account, or sign out to continue.
          </p>
        </div>

        <Button onClick={handleSignOut} disabled={isLoggingOut} size="lg">
          {isLoggingOut ? (
            <>
              <LoaderCircleIcon className="animate-spin" />
              Signing out...
            </>
          ) : (
            "Sign out"
          )}
        </Button>
      </div>
    </div>
  )
}
