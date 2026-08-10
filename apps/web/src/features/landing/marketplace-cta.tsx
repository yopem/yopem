"use client"

import { Link, useRouteContext } from "@tanstack/react-router"

import { Button } from "ui/button"

import { loginAndRedirect } from "@/lib/login"

interface MarketplaceCtaProps {
  loggedInClassName?: string
  loggedOutClassName?: string
}

export function MarketplaceCta({
  loggedInClassName,
  loggedOutClassName,
}: MarketplaceCtaProps) {
  const { session } = useRouteContext({ from: "__root__" })

  if (session) {
    return (
      <Button
        className={loggedInClassName}
        size="lg"
        render={<Link to="/products">Browse marketplace</Link>}
      />
    )
  }

  return (
    <Button
      className={loggedOutClassName}
      size="lg"
      onClick={() => void loginAndRedirect("/products")}
    >
      Get Started
    </Button>
  )
}
