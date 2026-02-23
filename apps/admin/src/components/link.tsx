"use client"

import type { ReactNode } from "react"

import { type ForesightRegisterOptions } from "js.foresight"
import NextLink, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

import useForesight from "@/hooks/use-foresight"

interface ForesightLinkProps
  extends
    Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: ReactNode
  className?: string
}

const Link = ({ children, className, ...props }: ForesightLinkProps) => {
  const router = useRouter()

  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      const href =
        typeof props.href === "string"
          ? props.href
          : (props.href.pathname ?? "/")
      router.prefetch(href)
    },
    hitSlop: props.hitSlop,
    name: props.name,
    meta: props.meta,
    reactivateAfter: props.reactivateAfter,
  })

  return (
    <NextLink {...props} ref={elementRef} className={className}>
      {children}
    </NextLink>
  )
}

export default Link
