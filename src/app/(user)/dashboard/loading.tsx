"use client"

import { Shimmer } from "shimmer-from-structure"

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <Shimmer>
      <Skeleton />
    </Shimmer>
  )
}
