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

import { flattenCategoryTree } from "@/components/categories-tags/category-tree"

interface ProductFormCategoryDialogProps {
  open: boolean
  name: string
  description: string | undefined
  parentId: string | undefined
  categories: {
    id: string
    name: string
    parentId: string | null
    sortOrder: number | null
  }[]
  createMutation: UseMutationResult<
    unknown,
    Error,
    { name: string; description?: string; parentId?: string },
    unknown
  >
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onParentIdChange: (value: string | undefined) => void
  onCancel: () => void
}

export function ProductFormCategoryDialog({
  open,
  name,
  description,
  parentId,
  categories,
  createMutation,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onParentIdChange,
  onCancel,
}: ProductFormCategoryDialogProps) {
  const tree = flattenCategoryTree(categories)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Create New Category</h2>
            <p className="text-muted-foreground text-sm">
              Add a new category to organize your products
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                createMutation.mutate({
                  name,
                  description: description ?? undefined,
                  ...(parentId ? { parentId } : {}),
                })
              }
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
