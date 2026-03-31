"use client"

import { Result } from "better-result"

import { cn } from "ui"
import { Button } from "ui/button"

import { loginFn } from "@/lib/auth"
import { AuthRedirectError } from "@/lib/errors"

const CTAButton = ({ className }: { className?: string }) => {
  const handleLogin = async () => {
    const result = await Result.tryPromise({
      try: async () => {
        const response = await loginFn()
        return response as unknown
      },
      catch: (error) => {
        if (error && typeof error === "object") {
          const err = error as {
            status?: number
            href?: string
            options?: { href?: string }
          }
          if (err.status === 307) {
            const redirectUrl = err.href || err.options?.href
            if (redirectUrl) {
              return new AuthRedirectError({
                message: `Redirect required to ${redirectUrl}`,
                redirectUrl,
              })
            }
          }
        }
        return error
      },
    })

    result.match({
      ok: (response) => {
        if (response && typeof response === "object") {
          const res = response as {
            status?: number
            options?: { href?: string }
          }
          if (res.status === 307 && res.options?.href) {
            window.location.href = res.options.href
          }
        }
      },
      err: (error) => {
        if (error instanceof AuthRedirectError) {
          window.location.href = error.redirectUrl
        } else {
          throw error
        }
      },
    })
  }

  return (
    <Button
      onClick={handleLogin}
      size="lg"
      className={cn(
        `h-11 rounded-full px-8 text-sm font-medium shadow-sm transition-transform hover:scale-105 active:scale-95`,
        className,
      )}
    >
      Get Started
    </Button>
  )
}

export default CTAButton
