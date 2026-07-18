"use client"

import { cn } from "ui"
import { Button } from "ui/button"

import { loginFn } from "@/lib/auth"

const CTAButton = ({ className }: { className?: string }) => {
  const handleLogin = async () => {
    const result = await loginFn()
    if (result?.redirectTo) {
      window.location.href = result.redirectTo
    }
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
