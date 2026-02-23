"use client"

import { Button } from "@repo/ui/button"
import { Separator } from "@repo/ui/separator"
import { Check as CheckIcon } from "lucide-react"
import { useState } from "react"

interface CategoryItem {
  id: string
  name: string
  slug: string
  description: string | null
}

interface TagItem {
  id: string
  name: string
  slug: string
}

interface MarketplaceSidebarProps {
  categories: CategoryItem[]
  tags: TagItem[]
  selectedCategories?: string[]
  selectedTags?: string[]
  selectedPriceFilter?: string
  onCategoriesChange: (categoryIds: string[]) => void
  onTagsChange: (tagIds: string[]) => void
  onPriceFilterChange: (filter: string | undefined) => void
}

const PRICE_FILTERS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
]

const EMPTY_CATEGORIES: string[] = []
const EMPTY_TAGS: string[] = []

const MarketplaceSidebar = ({
  categories,
  tags,
  selectedCategories = EMPTY_CATEGORIES,
  selectedTags = EMPTY_TAGS,
  selectedPriceFilter = "all",
  onCategoriesChange,
  onTagsChange,
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

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId))
    } else {
      onCategoriesChange([...selectedCategories, categoryId])
    }
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPriceFilter !== "all" ||
    selectedTags.length > 0

  return (
    <nav className="w-full space-y-6" aria-label="Filters">
      <div className="space-y-4">
        <button
          onClick={() => toggleSection("price")}
          aria-expanded={expandedSections.price}
          className="text-foreground flex w-full items-center justify-between text-xs font-semibold tracking-tight uppercase"
        >
          <span>Pricing</span>
        </button>

        {expandedSections.price && (
          <div className="space-y-1.5" id="price-filter-section">
            {PRICE_FILTERS.map((filter) => {
              const isSelected = selectedPriceFilter === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => onPriceFilterChange(filter.value)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{filter.label}</span>
                  {isSelected && <CheckIcon className="size-4" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="bg-border/60" />

      <div className="space-y-4">
        <button
          onClick={() => toggleSection("categories")}
          aria-expanded={expandedSections.categories}
          className="text-foreground flex w-full items-center justify-between text-xs font-semibold tracking-tight uppercase"
        >
          <span>Categories</span>
        </button>

        {expandedSections.categories && (
          <div className="space-y-1.5" id="category-filter-section">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id)
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{category.name}</span>
                  {isSelected && <CheckIcon className="size-4" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {categories.length > 0 && tags.length > 0 && (
        <Separator className="bg-border/60" />
      )}

      {tags.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => toggleSection("tags")}
            aria-expanded={expandedSections.tags}
            className="text-foreground flex w-full items-center justify-between text-xs font-semibold tracking-tight uppercase"
          >
            <span>Tags</span>
          </button>

          {expandedSections.tags && (
            <div className="flex flex-wrap gap-2" id="tags-section">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{tag.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              onCategoriesChange([])
              onPriceFilterChange("all")
              onTagsChange([])
            }}
            className="text-muted-foreground hover:text-foreground w-full rounded-lg"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </nav>
  )
}

export default MarketplaceSidebar
