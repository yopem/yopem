"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface ToolFormTagDialogProps {
  open: boolean
  name: string
  createMutation: UseMutationResult<unknown, Error, void, unknown>
  onOpenChange: (open: boolean) => void
  onNameChange: (value: string) => void
  onCancel: () => void
}

const ToolFormTagDialog = ({
  open,
  name,
  createMutation,
  onOpenChange,
  onNameChange,
  onCancel,
}: ToolFormTagDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Create New Tag</h2>
            <p className="text-muted-foreground text-sm">
              Add a new tag to label your tools
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

export default ToolFormTagDialog
