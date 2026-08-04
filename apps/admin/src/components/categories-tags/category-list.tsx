"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { Button } from "ui/button"

import { DeleteDialog } from "@/components/delete-dialog"

import { flattenCategoryTree, getCategoryDescendantIds } from "./category-tree"

interface Category {
  id: string
  name: string
  description?: string | null
  parentId: string | null
  sortOrder: number | null
}

interface CategoryListProps {
  categories: Category[] | undefined
  isLoading: boolean
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  deleteMutation: Pick<
    UseMutationResult<unknown, Error, unknown, unknown>,
    "isPending"
  >
}

export function CategoryList({
  categories,
  isLoading,
  onEdit,
  onDelete,
  deleteMutation,
}: CategoryListProps) {
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [pendingDeleteWithChildren, setPendingDeleteWithChildren] = useState<
    string | null
  >(null)

  const tree = flattenCategoryTree(categories ?? [])

  const handleDelete = (id: string) => {
    const descendants = getCategoryDescendantIds(categories ?? [], id)
    const category = categories?.find((c) => c.id === id)
    if (descendants.length > 0) {
      setPendingDeleteWithChildren(id)
    } else if (category) {
      setPendingDelete(category)
    }
  }

  const handleConfirmDelete = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id)
      setPendingDelete(null)
    }
    if (pendingDeleteWithChildren) {
      onDelete(pendingDeleteWithChildren)
      setPendingDeleteWithChildren(null)
    }
  }

  const cancelDelete = () => {
    setPendingDelete(null)
    setPendingDeleteWithChildren(null)
  }

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
          ) : tree.length > 0 ? (
            tree.map(({ node, depth }) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-4"
                style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{node.name}</h3>
                  {node.description && (
                    <p className="text-muted-foreground text-sm">
                      {node.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(node)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(node.id)}
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

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) cancelDelete()
        }}
        title="Delete Category"
        name={pendingDelete?.name}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />

      <DeleteDialog
        open={pendingDeleteWithChildren !== null}
        onOpenChange={(open) => {
          if (!open) cancelDelete()
        }}
        title="Delete Category"
        description="This category has child categories. Deleting it will move those children to the top level. Are you sure?"
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
