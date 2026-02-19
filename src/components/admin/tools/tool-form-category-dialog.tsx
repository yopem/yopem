"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ToolFormCategoryDialogProps {
  open: boolean
  name: string
  description: string | undefined
  createMutation: UseMutationResult<unknown, Error, void, unknown>
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCancel: () => void
}

const ToolFormCategoryDialog = ({
  open,
  name,
  description,
  createMutation,
  onOpenChange,
  onNameChange,
  onDescriptionChange,
  onCancel,
}: ToolFormCategoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Create New Category</h2>
            <p className="text-muted-foreground text-sm">
              Add a new category to organize your tools
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
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

export default ToolFormCategoryDialog
