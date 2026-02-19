"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface TagDialogProps {
  open: boolean
  editing: { id: string; name: string } | null
  name: string
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  createMutation: UseMutationResult<unknown, Error, void, unknown>
  updateMutation: UseMutationResult<unknown, Error, void, unknown>
}

const TagDialog = ({
  open,
  editing,
  name,
  onOpenChange,
  onNameChange,
  onSubmit,
  onCancel,
  createMutation,
  updateMutation,
}: TagDialogProps) => {
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              {editing ? "Edit Tag" : "Create New Tag"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {editing
                ? "Update the tag name"
                : "Add a new tag to label your tools"}
            </p>
          </div>

          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter tag name"
            />
          </Field>

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

export default TagDialog
