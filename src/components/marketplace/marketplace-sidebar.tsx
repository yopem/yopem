"use client"

import { Check as CheckIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SelectCategory, SelectTag } from "@/lib/db/schema"

interface MarketplaceSidebarProps {
  categories: SelectCategory[]
  tags: SelectTag[]
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
    <nav className="w-full space-y-4" aria-label="Filters">
      <div className="space-y-2">
        <button
          onClick={() => toggleSection("price")}
          aria-expanded={expandedSections.price}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          <span>Price</span>
        </button>

        {expandedSections.price && (
          <div className="space-y-1" id="price-filter-section">
            {PRICE_FILTERS.map((filter) => {
              const isSelected = selectedPriceFilter === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => onPriceFilterChange(filter.value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                    isSelected
                      ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{filter.label}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <button
          onClick={() => toggleSection("categories")}
          aria-expanded={expandedSections.categories}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          <span>Categories</span>
        </button>

        {expandedSections.categories && (
          <div className="space-y-1" id="category-filter-section">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id)
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                    isSelected
                      ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{category.name}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {categories.length > 0 && tags.length > 0 && <Separator />}

      {tags.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("tags")}
            aria-expanded={expandedSections.tags}
            className="flex w-full items-center justify-between text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            <span>Tags</span>
          </button>

          {expandedSections.tags && (
            <div className="space-y-1" id="tags-section">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                      isSelected
                        ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{tag.name}</span>
                    {isSelected && <CheckIcon className="size-3.5" />}
                  </button>
                )
              })}
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
              onCategoriesChange([])
              onPriceFilterChange("all")
              onTagsChange([])
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Clear filters
          </Button>
        </>
      )}
    </nav>
  )
}

export default MarketplaceSidebar
