"use client"

import { Card, CardContent, CardHeader } from "@repo/ui/card"
import { Skeleton } from "@repo/ui/skeleton"

export function AssetSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="aspect-square p-0">
            <Skeleton className="size-full" />
          </CardContent>
          <CardHeader className="p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
