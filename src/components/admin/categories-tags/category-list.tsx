"use client"

import type { UseMutationResult } from "@tanstack/react-query"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

import { Button } from "@/components/ui/button"

interface Category {
  id: string
  name: string
  description?: string | null
}

interface CategoryListProps {
  categories: Category[] | undefined
  isLoading: boolean
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>
}

const CategoryList = ({
  categories,
  isLoading,
  onEdit,
  onDelete,
  deleteMutation,
}: CategoryListProps) => {
  return (
    <div className="border-border rounded-lg border">
      <div className="divide-border divide-y">
        <Shimmer loading={isLoading}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">Loading...</h3>
                  <p className="text-muted-foreground text-sm">
                    Loading description...
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground text-sm">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground p-8 text-center">
              No categories yet. Create your first category to get started.
            </div>
          )}
        </Shimmer>
      </div>
    </div>
  )
}

export default CategoryList
