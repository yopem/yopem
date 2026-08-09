"use client"

import type { UseMutationResult } from "@tanstack/react-query"

import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import * as v from "valibot"

import { Button } from "ui/button"
import { Dialog, DialogPopup } from "ui/dialog"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Textarea } from "ui/textarea"

import { SlugField } from "@/components/slug-field"

import { CategoryParentSelect } from "./category-parent-select"
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
  editing: {
    id: string
    name: string
    slug?: string | null
    description?: string | null
    parentId?: string | null
  } | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: {
    name: string
    slug?: string
    description?: string
    parentId?: string
  }) => void
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

export function CategoryDialog({
  open,
  editing,
  categories,
  onOpenChange,
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

  const form = useForm({
    defaultValues: {
      name: editing?.name ?? "",
      slug: editing?.slug ?? "",
      description: editing?.description ?? "",
      parentId: editing?.parentId ?? undefined,
    },
    onSubmit: ({ value }) => {
      onSubmit({
        name: value.name,
        ...(value.slug ? { slug: value.slug } : {}),
        description: value.description || undefined,
        parentId: value.parentId,
      })
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        slug: editing?.slug ?? "",
        description: editing?.description ?? "",
        parentId: editing?.parentId ?? undefined,
      })
    }
  }, [open, editing, form])

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
            {editing && (
              <form.Field name="slug">
                {(field) => (
                  <SlugField
                    value={field.state.value}
                    onChange={field.handleChange}
                    entity="category"
                    excludeId={editing.id}
                  />
                )}
              </form.Field>
            )}
            <form.Field name="parentId">
              {(field) => (
                <CategoryParentSelect
                  value={field.state.value}
                  onChange={field.handleChange}
                  categories={categories}
                  tree={tree}
                />
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
