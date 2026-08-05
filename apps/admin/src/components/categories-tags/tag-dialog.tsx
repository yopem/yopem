"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import * as v from "valibot"

import { Button } from "ui/button"
import { Dialog, DialogPopup } from "ui/dialog"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"

interface TagDialogProps {
  open: boolean
  editing: { id: string; name: string } | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: { name: string }) => void
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

const nameValidator = v.pipe(
  v.string(),
  v.minLength(1, "Name is required"),
  v.trim(),
)

export function TagDialog({
  open,
  editing,
  onOpenChange,
  onSubmit,
  onCancel,
  createMutation,
  updateMutation,
}: TagDialogProps) {
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm({
    defaultValues: {
      name: editing?.name ?? "",
    },
    onSubmit: ({ value }) => {
      onSubmit({ name: value.name })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: editing?.name ?? "" })
    }
  }, [open, editing, form])

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
                : "Add a new tag to label your products"}
            </p>
          </div>

          <form.Field
            name="name"
            validators={{
              onMount: nameValidator,
              onChange: nameValidator,
              onSubmit: nameValidator,
            }}
          >
            {(field) => (
              <Field invalid={field.state.meta.errors.length > 0}>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter tag name"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive-foreground text-xs">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </Field>
            )}
          </form.Field>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  onClick={() => void form.handleSubmit()}
                  disabled={!canSubmit || isPending}
                >
                  {isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
