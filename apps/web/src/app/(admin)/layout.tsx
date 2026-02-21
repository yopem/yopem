import { Suspense, type ReactNode } from "react"

import { AdminDashboardLoading } from "./dashboard/admin/loading"

export default function AdminGroupLayout({
  children,
}: {
  children: ReactNode
}) {
  return <Suspense fallback={<AdminDashboardLoading />}>{children}</Suspense>
}
