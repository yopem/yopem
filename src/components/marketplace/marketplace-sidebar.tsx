"use client"

import {
  Check as CheckIcon,
  Filter as FilterIcon,
  Tag as TagIcon,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SelectCategory, SelectTag } from "@/lib/db/schema"

interface MarketplaceSidebarProps {
  categories: SelectCategory[]
  tags: SelectTag[]
  selectedCategory?: string
  selectedPriceFilter?: string
  onCategoryChange: (categoryId: string | undefined) => void
  onPriceFilterChange: (filter: string | undefined) => void
}

const PRICE_FILTERS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
]

const MarketplaceSidebar = ({
  categories,
  tags,
  selectedCategory,
  selectedPriceFilter = "all",
  onCategoryChange,
  onPriceFilterChange,
}: MarketplaceSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    categories: true,
    tags: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const hasActiveFilters =
    selectedCategory !== undefined || selectedPriceFilter !== "all"

  return (
    <aside className="w-full space-y-6" aria-label="Marketplace filters">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <FilterIcon className="size-4" />
        <span>Filters</span>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => toggleSection("price")}
          aria-expanded={expandedSections.price}
          aria-controls="price-filter-section"
          className="hover:text-foreground flex w-full items-center justify-between text-sm font-medium transition-colors duration-200"
        >
          <span>Price</span>
          <span className="text-muted-foreground text-xs" aria-hidden="true">
            {expandedSections.price ? "−" : "+"}
          </span>
        </button>

        {expandedSections.price && (
          <div
            id="price-filter-section"
            role="group"
            aria-label="Price filters"
            className="space-y-1"
          >
            {PRICE_FILTERS.map((filter) => {
              const isSelected = selectedPriceFilter === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => onPriceFilterChange(filter.value)}
                  aria-pressed={isSelected}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <span>{filter.label}</span>
                  {isSelected && (
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <button
          onClick={() => toggleSection("categories")}
          aria-expanded={expandedSections.categories}
          aria-controls="category-filter-section"
          className="hover:text-foreground flex w-full items-center justify-between text-sm font-medium transition-colors duration-200"
        >
          <span>Categories</span>
          <span className="text-muted-foreground text-xs" aria-hidden="true">
            {expandedSections.categories ? "−" : "+"}
          </span>
        </button>

        {expandedSections.categories && (
          <div
            id="category-filter-section"
            role="group"
            aria-label="Category filters"
            className="space-y-1"
          >
            <button
              onClick={() => onCategoryChange(undefined)}
              aria-pressed={!selectedCategory}
              className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                !selectedCategory
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <span>All Categories</span>
              {!selectedCategory && (
                <CheckIcon className="size-3.5" aria-hidden="true" />
              )}
            </button>

            {categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  aria-pressed={isSelected}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {category.icon && (
                      <span className="text-base" aria-hidden="true">
                        {category.icon}
                      </span>
                    )}
                    <span>{category.name}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {categories.length > 0 && tags.length > 0 && <Separator />}

      {tags.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection("tags")}
            aria-expanded={expandedSections.tags}
            aria-controls="tags-section"
            className="hover:text-foreground flex w-full items-center justify-between text-sm font-medium transition-colors duration-200"
          >
            <span>Tags</span>
            <span className="text-muted-foreground text-xs" aria-hidden="true">
              {expandedSections.tags ? "−" : "+"}
            </span>
          </button>

          {expandedSections.tags && (
            <div id="tags-section" className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  className="h-7 cursor-pointer rounded-full px-3 text-xs transition-colors duration-200"
                >
                  <TagIcon className="mr-1.5 size-3" aria-hidden="true" />
                  {tag.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCategoryChange(undefined)
              onPriceFilterChange("all")
            }}
            aria-label="Clear all active filters"
            className="w-full text-sm transition-colors duration-200"
          >
            Clear All Filters
          </Button>
        </>
      )}
    </aside>
  )
}

export default MarketplaceSidebar
