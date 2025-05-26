import * as React from "react"
import NextLink, { type LinkProps as NextLinkProps } from "next/link"

interface LinkProps
  extends React.HTMLAttributes<HTMLAnchorElement>,
    NextLinkProps {}

const Link: React.FC<LinkProps> = (props) => {
  return <NextLink prefetch scroll={false} {...props} />
}

export default Link
