"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@repo/ui/button"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { Shimmer } from "shimmer-from-structure"

interface Tag {
  id: string
  name: string
}

interface TagListProps {
  tags: Tag[] | undefined
  isLoading: boolean
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>
}

const TagList = ({
  tags,
  isLoading,
  onEdit,
  onDelete,
  deleteMutation,
}: TagListProps) => {
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
                    onClick={() => onDelete(tag.id)}
                    disabled={deleteMutation.isPending}
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
    </div>
  )
}

export default TagList
