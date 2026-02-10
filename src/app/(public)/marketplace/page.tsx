"use client"

import { useQuery } from "@tanstack/react-query"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import { queryApi } from "@/lib/orpc/query"

export default function MarketplacePage() {
  const { data, isLoading } = useQuery({
    ...queryApi.tools.list.queryOptions({ input: { limit: 21 } }),
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Tools Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover and use AI-powered tools for your workflows
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <MarketplaceGrid initialTools={data?.tools ?? []} />
      )}
    </div>
  )
}
