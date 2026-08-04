"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { Button } from "ui/button"

import { DeleteDialog } from "@/components/delete-dialog"

interface Tag {
  id: string
  name: string
}

interface TagListProps {
  tags: Tag[] | undefined
  isLoading: boolean
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
  deleteMutation: Pick<
    UseMutationResult<unknown, Error, unknown, unknown>,
    "isPending"
  >
}

export function TagList({
  tags,
  isLoading,
  onEdit,
  onDelete,
  deleteMutation,
}: TagListProps) {
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null)

  const handleConfirm = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id)
      setPendingDelete(null)
    }
  }

  return (
    <div className="border-border rounded-lg border">
      <div className="divide-border divide-y">
        <Shimmer loading={isLoading}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <h3 className="font-medium">Loading...</h3>
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
          ) : tags && tags.length > 0 ? (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4"
              >
                <h3 className="font-medium">{tag.name}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(tag)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(tag)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground p-8 text-center">
              No tags yet. Create your first tag to get started.
            </div>
          )}
        </Shimmer>
      </div>

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete Tag"
        name={pendingDelete?.name}
        onConfirm={handleConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
