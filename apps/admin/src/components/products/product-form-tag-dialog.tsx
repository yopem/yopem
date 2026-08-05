"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import * as v from "valibot"

import { Button } from "ui/button"
import { Dialog, DialogPopup } from "ui/dialog"
import { Field, FieldError, FieldLabel } from "ui/field"
import { Input } from "ui/input"

interface ProductFormTagDialogProps {
  open: boolean
  createMutation: UseMutationResult<unknown, Error, { name: string }, unknown>
  onOpenChange: (open: boolean) => void
  onCancel: () => void
}

const nameValidator = v.pipe(
  v.string(),
  v.minLength(1, "Name is required"),
  v.trim(),
)

export function ProductFormTagDialog({
  open,
  createMutation,
  onOpenChange,
  onCancel,
}: ProductFormTagDialogProps) {
  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: "" })
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <div className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Create New Tag</h2>
            <p className="text-muted-foreground text-sm">
              Add a new tag to label your products
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
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter tag name"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  type="button"
                  onClick={() => void form.handleSubmit()}
                  disabled={!canSubmit || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
