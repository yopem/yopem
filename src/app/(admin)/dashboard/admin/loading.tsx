"use client"

import { Shimmer } from "shimmer-from-structure"

export function AdminDashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Shimmer loading={true}>
        <div className="bg-muted size-full" />
      </Shimmer>
    </div>
  )
}

export default AdminDashboardLoading
