import type { ReactNode } from "react"

import { Link as RouterLink } from "@tanstack/react-router"

interface LinkProps {
  href: string
  children: ReactNode
  className?: string
}

const Link = ({ href, children, className }: LinkProps) => {
  return (
    <RouterLink to={href} className={className}>
      {children}
    </RouterLink>
  )
}

export default Link
