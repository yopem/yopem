"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { Spinner } from "ui/spinner"

import { DeleteDialog } from "@/components/delete-dialog"

interface Tag {
  id: string
  name: string
}

interface TagListProps {
  tags: Tag[] | undefined
  isLoading: boolean
  selectedIds: string[]
  onToggleAll: (visibleIds: string[], allSelected: boolean) => void
  onToggleItem: (id: string) => void
  onEdit: (tag: Tag) => void
  onDelete: (id: string) => void
  deleteMutation: Pick<
    UseMutationResult<unknown, Error, unknown, unknown>,
    "isPending"
  >
}

const COLLAPSED_LIMIT = 10

export function TagList({
  tags,
  isLoading,
  selectedIds,
  onToggleAll,
  onToggleItem,
  onEdit,
  onDelete,
  deleteMutation,
}: TagListProps) {
  const [expanded, setExpanded] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null)

  const visibleTags = expanded
    ? (tags ?? [])
    : (tags ?? []).slice(0, COLLAPSED_LIMIT)
  const hasMore = (tags?.length ?? 0) > COLLAPSED_LIMIT
  const selectedSet = new Set(selectedIds)

  const handleToggleAll = () => {
    const visibleIds = visibleTags.map((tag) => tag.id)
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id))
    onToggleAll(visibleIds, allSelected)
  }

  const handleConfirm = () => {
    if (pendingDelete) {
      onDelete(pendingDelete.id)
      setPendingDelete(null)
    }
  }

  return (
    <div className="border-border rounded-lg border">
      <div className="divide-border divide-y">
        <div className="flex items-center gap-2 border-b p-4">
          <Checkbox
            checked={
              visibleTags.length > 0 &&
              visibleTags.every((tag) => selectedSet.has(tag.id))
            }
            onCheckedChange={handleToggleAll}
          />
          <span className="text-muted-foreground text-sm">Select all</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="text-muted-foreground size-8" />
          </div>
        ) : tags && tags.length > 0 ? (
          visibleTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedSet.has(tag.id)}
                  onCheckedChange={() => onToggleItem(tag.id)}
                />
                <h3 className="font-medium">{tag.name}</h3>
              </div>
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
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-none border-t"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show Less"
            : `Show All (${(tags?.length ?? 0) - COLLAPSED_LIMIT})`}
        </Button>
      )}

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
