"use client"

import NextLink, { type LinkProps } from "next/link"
import type { ReactNode } from "react"

interface AdminLinkProps extends Omit<LinkProps, "prefetch"> {
  children: ReactNode
  className?: string
}

const Link = ({ children, className, ...props }: AdminLinkProps) => {
  return (
    <NextLink {...props} className={className}>
      {children}
    </NextLink>
  )
}

export default Link
