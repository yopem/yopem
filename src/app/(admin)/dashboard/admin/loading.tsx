"use client"

import { Shimmer } from "shimmer-from-structure"

import { Skeleton } from "@/components/ui/skeleton"

export function AdminDashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Shimmer>
        <Skeleton className="size-full" />
      </Shimmer>
    </div>
  )
}

export default AdminDashboardLoading
