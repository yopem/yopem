import { Skeleton } from "@repo/ui/skeleton"
import { Suspense, type ReactNode } from "react"

export default function UserRootLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
