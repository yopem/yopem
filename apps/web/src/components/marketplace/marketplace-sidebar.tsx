"use client"

import { Check as CheckIcon } from "lucide-react"

import { Separator } from "ui/separator"

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
      <div className="space-y-2">
        <p className="text-foreground text-xs font-semibold tracking-tight uppercase">
          Pricing
        </p>
        <div className="space-y-0.5" id="price-filter-section">
          {PRICE_FILTERS.map((filter) => {
            const isSelected = selectedPriceFilter === filter.value
            return (
              <button
                type="button"
                key={filter.value}
                onClick={() => onPriceFilterChange(filter.value)}
                className={`flex w-full items-center justify-between py-1.5 pl-3 text-sm transition-colors ${
                  isSelected
                    ? "border-primary text-primary border-l-2 font-medium"
                    : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                <span>{filter.label}</span>
                {isSelected && <CheckIcon className="size-3.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="bg-border/60" />

      <div className="space-y-2">
        <p className="text-foreground text-xs font-semibold tracking-tight uppercase">
          Categories
        </p>
        <div className="space-y-0.5" id="category-filter-section">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex w-full items-center justify-between py-1.5 pl-3 text-sm transition-colors ${
                  isSelected
                    ? "border-primary text-primary border-l-2 font-medium"
                    : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                <span>{category.name}</span>
                {isSelected && <CheckIcon className="size-3.5" />}
              </button>
            )
          })}
        </div>
      </div>

      {categories.length > 0 && tags.length > 0 && (
        <Separator className="bg-border/60" />
      )}

      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-xs font-semibold tracking-tight uppercase">
            Tags
          </p>
          <div className="space-y-0.5" id="tags-section">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id)
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`flex w-full items-center justify-between py-1.5 pl-3 text-sm transition-colors ${
                    isSelected
                      ? "border-primary text-primary border-l-2 font-medium"
                      : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span>{tag.name}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              onCategoriesChange([])
              onPriceFilterChange("all")
              onTagsChange([])
            }}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </nav>
  )
}

export default MarketplaceSidebar
