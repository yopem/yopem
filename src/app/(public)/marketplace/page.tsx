"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import MarketplaceSidebar from "@/components/marketplace/marketplace-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { queryApi } from "@/lib/orpc/query"

export default function MarketplacePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleCategoriesChange = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds)
  }

  const handlePriceFilterChange = (filter: string | undefined) => {
    setSelectedPriceFilter(filter ?? "all")
  }

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTags(tagIds)
  }

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    ...queryApi.tools.getCategories.queryOptions({}),
  })

  const { data: tags = [], isLoading: isTagsLoading } = useQuery({
    ...queryApi.tools.getTags.queryOptions({}),
  })

  const isSidebarLoading = isCategoriesLoading || isTagsLoading

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
            {isSidebarLoading ? (
              <Shimmer>
                <div className="space-y-6">
                  <Skeleton className="h-6 w-20" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <div className="space-y-1">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                </div>
              </Shimmer>
            ) : (
              <MarketplaceSidebar
                categories={categories}
                tags={tags}
                selectedCategories={selectedCategories}
                selectedTags={selectedTags}
                selectedPriceFilter={selectedPriceFilter}
                onCategoriesChange={handleCategoriesChange}
                onTagsChange={handleTagsChange}
                onPriceFilterChange={handlePriceFilterChange}
              />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <MarketplaceGrid
            categoryIds={selectedCategories}
            tagIds={selectedTags}
            priceFilter={selectedPriceFilter}
            status="active"
          />
        </div>
      </div>
    </div>
  )
}
