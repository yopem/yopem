"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import type { SelectCategory } from "db/schema"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { Input } from "ui/input"

import { flattenCategoryTree } from "./category-tree"

export type CategorySelectorType = Pick<
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
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId))
    } else {
      onChange([...selectedIds, categoryId])
    }
  }

  const selectedCategories = categories.filter((cat) =>
    selectedIds.includes(cat.id),
  )

  const tree = flattenCategoryTree(categories)

  const filteredTree = tree.filter(({ node }) =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const baseIndent = 1.5

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border">
      <div className="border-border flex items-center justify-between border-b p-3">
        <h4 className="text-sm font-semibold">Category</h4>
        {onAddNew && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onAddNew}
            className="h-auto p-0 text-xs"
          >
            + Add New
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="h-8 text-sm"
        />
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
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
                  checked={selectedIds.includes(node.id)}
                  onCheckedChange={() => toggleCategory(node.id)}
                />
                <span className="text-sm">{node.name}</span>
              </label>
            ))
          )}
        </div>
        {selectedCategories.length > 0 && (
          <div className="border-border flex flex-wrap gap-1 border-t pt-3">
            {selectedCategories.map((category) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="hover:text-destructive ml-1"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
