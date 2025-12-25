"use client"

import NextLink, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"
import { type ForesightRegisterOptions } from "js.foresight"

import useForesight from "@/hooks/use-foresight"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: React.ReactNode
  className?: string
}

const Link = ({ children, className, ...props }: ForesightLinkProps) => {
  const router = useRouter()

  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      router.prefetch(props.href.toString())
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
