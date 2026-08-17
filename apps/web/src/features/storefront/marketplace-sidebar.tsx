"use client"

import { useNavigate, useSearch } from "@tanstack/react-router"
import { CheckIcon } from "lucide-react"

import { ScrollArea } from "ui/scroll-area"
import { Separator } from "ui/separator"

import { toggleId } from "@/lib/utils/toggle-id"

interface FilterItem {
  id: string
  name: string
  slug: string
  productCount?: number
}

interface MarketplaceSidebarProps {
  categories: FilterItem[]
  tags: FilterItem[]
}

export function MarketplaceSidebar({
  categories,
  tags,
}: MarketplaceSidebarProps) {
  const navigate = useNavigate({ from: "/products/" })
  const search = useSearch({ from: "/products/" })

  const selectedCategories = search.categorySlugs ?? []
  const selectedTags = search.tagSlugs ?? []
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTags.length > 0

  const updateSearch = (patch: {
    categorySlugs?: string[]
    tagSlugs?: string[]
  }) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch, page: 1 }
        if (!next.categorySlugs || !(next.categorySlugs as string[]).length)
          delete next.categorySlugs
        if (!next.tagSlugs || !(next.tagSlugs as string[]).length)
          delete next.tagSlugs
        if (next.page === 1) delete next.page
        return next
      },
      replace: true,
    })
  }

  const toggleCategory = (categorySlug: string) => {
    updateSearch({
      categorySlugs: toggleId(selectedCategories, categorySlug),
    })
  }

  const toggleTag = (tagSlug: string) => {
    updateSearch({ tagSlugs: toggleId(selectedTags, tagSlug) })
  }

  const clearAll = () => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev }
        delete next.categorySlugs
        delete next.tagSlugs
        delete next.page
        return next
      },
      replace: true,
    })
  }

  return (
    <nav className="w-full shrink-0 space-y-6 lg:w-48" aria-label="Filters">
      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-xs font-semibold tracking-tight uppercase">
            Categories
          </p>
          <ScrollArea className="h-48">
            <div className="space-y-0.5" id="category-filter-section">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.slug)
                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => toggleCategory(category.slug)}
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
          </ScrollArea>
        </div>
      )}

      {categories.length > 0 && tags.length > 0 && (
        <Separator className="bg-border/60" />
      )}

      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-xs font-semibold tracking-tight uppercase">
            Tags
          </p>
          <ScrollArea className="h-48">
            <div className="space-y-0.5" id="tags-section">
              {tags.map((tag) => (
                <TagButton
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTags.includes(tag.slug)}
                  onToggle={() => toggleTag(tag.slug)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {hasActiveFilters && (
        <div className="pt-1">
          <button
            type="button"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </nav>
  )
}

function TagButton({
  tag,
  isSelected,
  onToggle,
}: {
  tag: FilterItem
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
}
