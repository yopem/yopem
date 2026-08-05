"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import * as v from "valibot"

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
  onCancel: () => void
}

const nameValidator = v.pipe(
  v.string(),
  v.minLength(1, "Name is required"),
  v.trim(),
)

export function ProductFormCategoryDialog({
  open,
  categories,
  createMutation,
  onOpenChange,
  onCancel,
}: ProductFormCategoryDialogProps) {
  const tree = flattenCategoryTree(categories)

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined as string | undefined,
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        name: value.name,
        description: value.description || undefined,
        ...(value.parentId ? { parentId: value.parentId } : {}),
      })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: "", description: "", parentId: undefined })
    }
  }, [open, form])

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
            <form.Field
              name="name"
              validators={{
                onBlur: nameValidator,
                onSubmit: nameValidator,
              }}
            >
              {(field) => (
                <Field invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter category name"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive-foreground text-xs">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field name="parentId">
              {(field) => (
                <Field>
                  <FieldLabel>Parent Category</FieldLabel>
                  <Select
                    value={field.state.value ?? ""}
                    onValueChange={(value) =>
                      field.handleChange(
                        value && value !== "" ? value : undefined,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent">
                        {field.state.value
                          ? (categories.find((c) => c.id === field.state.value)
                              ?.name ?? "No parent")
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
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </Field>
              )}
            </form.Field>
          </div>

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
