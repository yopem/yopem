"use client"

import type { clientApi } from "@repo/orpc/client"
import { useState } from "react"

import MarketplaceGrid from "@/components/marketplace/marketplace-grid"
import MarketplaceSidebar from "@/components/marketplace/marketplace-sidebar"

interface MarketplaceContentProps {
  categories: Awaited<ReturnType<typeof clientApi.tools.getCategories>>
  tags: Awaited<ReturnType<typeof clientApi.tools.getTags>>
}

export default function MarketplaceContent({
  categories,
  tags,
}: MarketplaceContentProps) {
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

  return (
    <div className="flex flex-col gap-10 md:flex-row md:items-start lg:gap-14">
      <div className="w-full shrink-0 md:w-64">
        <div className="bg-card sticky top-24 space-y-8 rounded-2xl border p-6 shadow-sm">
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
  )
}
