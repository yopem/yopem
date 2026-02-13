"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

const AssetsContainer = dynamic(
  () =>
    import("@/components/admin/assets/assets-container").then(
      (mod) => mod.AssetsContainer,
    ),
  {
    ssr: false,
  },
)

function AssetsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground mt-2 text-sm">Loading assets...</p>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<AssetsLoading />}>
      <AssetsContainer />
    </Suspense>
  )
}
