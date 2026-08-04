"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "ui/button"
import { Dialog, DialogPopup } from "ui/dialog"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Textarea } from "ui/textarea"

import {
  flattenCategoryTree,
  getCategoryDescendantIds,
  type CategoryTreeNode,
} from "./category-tree"

interface Category {
  id: string
  name: string
  parentId: string | null
  sortOrder: number | null
}

interface CategoryDialogProps {
  open: boolean
  editing: { id: string; name: string; description?: string | null } | null
  name: string
  description: string
  parentId: string | undefined
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onParentIdChange: (value: string | undefined) => void
  onSubmit: () => void
  onCancel: () => void
  createMutation: Pick<
    UseMutationResult<unknown, Error, unknown, unknown>,
    "isPending"
  >
  updateMutation: Pick<
    UseMutationResult<unknown, Error, unknown, unknown>,
    "isPending"
  >
}

export function CategoryDialog({
  open,
  editing,
  name,
  description,
  parentId,
  categories,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onParentIdChange,
  onSubmit,
  onCancel,
  createMutation,
  updateMutation,
}: CategoryDialogProps) {
  const isPending = createMutation.isPending || updateMutation.isPending

  const disabledIds = editing
    ? new Set([
        editing.id,
        ...getCategoryDescendantIds(
          categories as CategoryTreeNode[],
          editing.id,
        ),
      ])
    : new Set<string>()

  const tree = flattenCategoryTree(
    categories.filter((c) => !disabledIds.has(c.id)),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Category" : "Create New Category"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {editing
                ? "Update the category details"
                : "Add a new category to organize your products"}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter category name"
              />
            </Field>
            <Field>
              <FieldLabel>Parent Category</FieldLabel>
              <Select
                value={parentId ?? ""}
                onValueChange={(value) =>
                  onParentIdChange(value && value !== "" ? value : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent">
                    {parentId
                      ? (categories.find((c) => c.id === parentId)?.name ??
                        "No parent")
                      : "No parent"}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="">No parent</SelectItem>
                  {tree.map(({ node, depth }) => (
                    <SelectItem
                      key={node.id}
                      value={node.id}
                      className="truncate"
                      style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
                    >
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Enter category description (optional)"
                rows={3}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!name.trim() || isPending}>
              {isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
