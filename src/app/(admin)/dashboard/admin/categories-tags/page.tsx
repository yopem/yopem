"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Suspense } from "react"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { useCategories } from "@/hooks/use-categories"
import { useTags } from "@/hooks/use-tags"
import { queryApi } from "@/lib/orpc/query"

const CategoriesTagsContent = () => {
  const queryClient = useQueryClient()
  const { data: categories, isLoading: isLoadingCategories } = useCategories()
  const { data: tags, isLoading: isLoadingTags } = useTags()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)

  const [editingCategory, setEditingCategory] = useState<{
    id: string
    name: string
    description?: string | null
  } | null>(null)
  const [editingTag, setEditingTag] = useState<{
    id: string
    name: string
  } | null>(null)

  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [tagName, setTagName] = useState("")

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.categories.create.call({
        name: categoryName,
        description: categoryDescription || undefined,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Category created",
        description: `${categoryName} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      setCategoryName("")
      setCategoryDescription("")
      setCategoryDialogOpen(false)
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating category",
        description: error.message,
        type: "error",
      })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!editingCategory) return
      return await queryApi.categories.update.call({
        id: editingCategory.id,
        name: categoryName,
        description: categoryDescription || undefined,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Category updated",
        description: `${categoryName} has been updated successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      setCategoryName("")
      setCategoryDescription("")
      setEditingCategory(null)
      setCategoryDialogOpen(false)
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error updating category",
        description: error.message,
        type: "error",
      })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await queryApi.categories.delete.call({ id })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error deleting category",
        description: error.message,
        type: "error",
      })
    },
  })

  const createTagMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.tags.create.call({
        name: tagName,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tag created",
        description: `${tagName} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
      setTagName("")
      setTagDialogOpen(false)
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating tag",
        description: error.message,
        type: "error",
      })
    },
  })

  const updateTagMutation = useMutation({
    mutationFn: async () => {
      if (!editingTag) return
      return await queryApi.tags.update.call({
        id: editingTag.id,
        name: tagName,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tag updated",
        description: `${tagName} has been updated successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
      setTagName("")
      setEditingTag(null)
      setTagDialogOpen(false)
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error updating tag",
        description: error.message,
        type: "error",
      })
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      return await queryApi.tags.delete.call({ id })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tag deleted",
        description: "Tag has been deleted successfully.",
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error deleting tag",
        description: error.message,
        type: "error",
      })
    },
  })

  const handleOpenCategoryDialog = (category?: {
    id: string
    name: string
    description?: string | null
  }) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
      setCategoryDescription(category.description ?? "")
    } else {
      setEditingCategory(null)
      setCategoryName("")
      setCategoryDescription("")
    }
    setCategoryDialogOpen(true)
  }

  const handleOpenTagDialog = (tag?: { id: string; name: string }) => {
    if (tag) {
      setEditingTag(tag)
      setTagName(tag.name)
    } else {
      setEditingTag(null)
      setTagName("")
    }
    setTagDialogOpen(true)
  }

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate()
    } else {
      createCategoryMutation.mutate()
    }
  }

  const handleTagSubmit = () => {
    if (editingTag) {
      updateTagMutation.mutate()
    } else {
      createTagMutation.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories & Tags</h1>
        <p className="text-muted-foreground mt-2">
          Manage categories and tags for organizing your tools
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button size="sm" onClick={() => handleOpenCategoryDialog()}>
              <PlusIcon className="size-4" />
              Add Category
            </Button>
          </div>

          <div className="border-border rounded-lg border">
            <div className="divide-border divide-y">
              {isLoadingCategories ? (
                <Shimmer>
                  <div className="flex flex-col gap-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </Shimmer>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCategoryDialog(category)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteCategoryMutation.mutate(category.id)
                        }
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground p-8 text-center">
                  No categories yet. Create your first category to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tags</h2>
            <Button size="sm" onClick={() => handleOpenTagDialog()}>
              <PlusIcon className="size-4" />
              Add Tag
            </Button>
          </div>

          <div className="border-border rounded-lg border">
            <div className="divide-border divide-y">
              {isLoadingTags ? (
                <Shimmer>
                  <div className="flex flex-col gap-4 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Shimmer>
              ) : tags && tags.length > 0 ? (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4"
                  >
                    <h3 className="font-medium">{tag.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenTagDialog(tag)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTagMutation.mutate(tag.id)}
                        disabled={deleteTagMutation.isPending}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground p-8 text-center">
                  No tags yet. Create your first tag to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogPopup>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {editingCategory
                  ? "Update the category details"
                  : "Add a new category to organize your tools"}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryDialogOpen(false)
                  setEditingCategory(null)
                  setCategoryName("")
                  setCategoryDescription("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCategorySubmit}
                disabled={
                  !categoryName.trim() ||
                  createCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
              >
                {createCategoryMutation.isPending ||
                updateCategoryMutation.isPending
                  ? "Saving..."
                  : editingCategory
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogPopup>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">
                {editingTag ? "Edit Tag" : "Create New Tag"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {editingTag
                  ? "Update the tag name"
                  : "Add a new tag to label your tools"}
              </p>
            </div>

            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTagDialogOpen(false)
                  setEditingTag(null)
                  setTagName("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTagSubmit}
                disabled={
                  !tagName.trim() ||
                  createTagMutation.isPending ||
                  updateTagMutation.isPending
                }
              >
                {createTagMutation.isPending || updateTagMutation.isPending
                  ? "Saving..."
                  : editingTag
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  )
}

export default function CategoriesTagsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Shimmer>
            <Skeleton className="h-screen w-full" />
          </Shimmer>
        </div>
      }
    >
      <CategoriesTagsContent />
    </Suspense>
  )
}
