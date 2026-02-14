"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import MarketplaceSidebar from "@/components/marketplace/marketplace-sidebar"
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

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery(
    queryApi.tools.getCategories.queryOptions({}),
  )

  const { data: tags = [], isLoading: isTagsLoading } = useQuery(
    queryApi.tools.getTags.queryOptions({}),
  )

  const isSidebarLoading = isCategoriesLoading || isTagsLoading

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
          Browse Tools
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Explore and use AI-powered tools to automate your workflows
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="w-full shrink-0 lg:w-56">
          <div className="sticky top-20">
            <Shimmer loading={isSidebarLoading}>
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
            </Shimmer>
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
