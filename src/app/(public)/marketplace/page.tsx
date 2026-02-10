"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import MarketplaceSidebar from "@/components/marketplace/marketplace-sidebar"
import { queryApi } from "@/lib/orpc/query"

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  )
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>("all")

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategory(categoryId)
  }

  const handlePriceFilterChange = (filter: string | undefined) => {
    setSelectedPriceFilter(filter ?? "all")
  }

  const { data: toolsData, isLoading: isLoadingTools } = useQuery({
    ...queryApi.tools.list.queryOptions({
      input: {
        limit: 21,
        categoryId: selectedCategory,
        status: "active",
      },
    }),
  })

  const { data: categories = [] } = useQuery({
    ...queryApi.tools.getCategories.queryOptions({}),
  })

  const { data: tags = [] } = useQuery({
    ...queryApi.tools.getTags.queryOptions({}),
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          AI Tools Marketplace
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Discover and use AI-powered tools for your workflows
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64">
          <div className="sticky top-20">
            <MarketplaceSidebar
              categories={categories}
              tags={tags}
              selectedCategory={selectedCategory}
              selectedPriceFilter={selectedPriceFilter}
              onCategoryChange={handleCategoryChange}
              onPriceFilterChange={handlePriceFilterChange}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {isLoadingTools ? (
            <div className="space-y-6">
              <div className="flex h-11 w-full items-center gap-2">
                <div className="border-border bg-muted/50 h-11 flex-1 animate-pulse rounded-lg border" />
                <div className="border-border bg-muted/50 h-11 w-24 animate-pulse rounded-lg border" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-border bg-muted/50 h-48 animate-pulse rounded-lg border"
                  />
                ))}
              </div>
            </div>
          ) : (
            <MarketplaceGrid
              initialTools={toolsData?.tools ?? []}
              categoryId={selectedCategory}
              priceFilter={selectedPriceFilter}
              status="active"
            />
          )}
        </div>
      </div>
    </div>
  )
}
