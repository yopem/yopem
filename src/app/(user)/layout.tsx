import { Suspense, type ReactNode } from "react"

import { ShimmerWrapper } from "@/components/ui/shimmer-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

export default function UserRootLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ShimmerWrapper>
          <div className="flex flex-col gap-4 p-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </ShimmerWrapper>
      }
    >
      {children}
    </Suspense>
  )
}
