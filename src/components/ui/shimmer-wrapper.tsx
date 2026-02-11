"use client"

import { type ReactNode } from "react"
import { Shimmer } from "shimmer-from-structure"

export const ShimmerWrapper = ({ children }: { children: ReactNode }) => {
  return <Shimmer>{children}</Shimmer>
}
