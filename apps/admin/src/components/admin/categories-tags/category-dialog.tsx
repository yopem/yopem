"use client"

import { Button } from "@repo/ui/button"
import { Dialog, DialogPopup } from "@repo/ui/dialog"
import { Field, FieldLabel } from "@repo/ui/field"
import { Input } from "@repo/ui/input"
import { Textarea } from "@repo/ui/textarea"
import type { UseMutationResult } from "@tanstack/react-query"

interface CategoryDialogProps {
  open: boolean
  editing: { id: string; name: string; description?: string | null } | null
  name: string
  description: string
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  createMutation: UseMutationResult<unknown, Error, void, unknown>
  updateMutation: UseMutationResult<unknown, Error, void, unknown>
}

const CategoryDialog = ({
  open,
  editing,
  name,
  description,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
  createMutation,
  updateMutation,
}: CategoryDialogProps) => {
  const isPending = createMutation.isPending || updateMutation.isPending

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
                : "Add a new category to organize your tools"}
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

export default CategoryDialog
