"use client"

import { Shimmer } from "shimmer-from-structure"

export default function DashboardLoading() {
  return (
    <Shimmer loading={true}>
      <div className="bg-muted size-full" />
    </Shimmer>
  )
}
