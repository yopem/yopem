"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import type { SelectCategory } from "db/schema/categories"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { CollapsibleCard } from "ui/collapsible-card"
import { Input } from "ui/input"
import { ScrollArea } from "ui/scroll-area"

import { toggleId } from "@/lib/utils/toggle-id"

import { flattenCategoryTree } from "./category-tree"

type CategorySelectorType = Pick<
  SelectCategory,
  "id" | "name" | "slug" | "description" | "parentId" | "sortOrder"
>

interface CategorySelectorProps {
  categories: CategorySelectorType[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onAddNew?: () => void
}

export function CategorySelector({
  categories,
  selectedIds,
  onChange,
  onAddNew,
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const toggleCategory = (categoryId: string) => {
    onChange(toggleId(selectedIds, categoryId))
  }

  const selectedSet = new Set(selectedIds)

  const selectedCategories = categories.filter((cat) => selectedSet.has(cat.id))

  const tree = flattenCategoryTree(categories)

  const filteredTree = tree.filter(({ node }) =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const baseIndent = 1.5

  return (
    <CollapsibleCard
      title="Categories"
      action={
        onAddNew && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onAddNew}
            className="h-auto p-0 text-xs"
          >
            + Add New
          </Button>
        )
      }
    >
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search categories..."
        className="h-8 text-sm"
      />
      <ScrollArea className="h-48">
        <div className="flex flex-col gap-1">
          {categories.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center text-xs">
              No categories available
            </p>
          ) : filteredTree.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center text-xs">
              No matching categories
            </p>
          ) : (
            filteredTree.map(({ node, depth }) => (
              <label
                key={node.id}
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2 transition-colors"
                style={{ paddingLeft: `${depth * baseIndent}rem` }}
              >
                <Checkbox
                  checked={selectedSet.has(node.id)}
                  onCheckedChange={() => toggleCategory(node.id)}
                />
                <span className="text-sm">{node.name}</span>
              </label>
            ))
          )}
        </div>
      </ScrollArea>
      {selectedCategories.length > 0 && (
        <div className="border-border flex flex-wrap gap-1 border-t pt-3">
          {selectedCategories.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="hover:text-destructive ml-1"
                aria-label={`Remove ${category.name}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </CollapsibleCard>
  )
}
