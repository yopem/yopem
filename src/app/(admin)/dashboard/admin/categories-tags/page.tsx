"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { Suspense, useReducer } from "react"
import { Shimmer } from "shimmer-from-structure"

import CategoryDialog from "@/components/admin/categories-tags/category-dialog"
import CategoryList from "@/components/admin/categories-tags/category-list"
import TagDialog from "@/components/admin/categories-tags/tag-dialog"
import TagList from "@/components/admin/categories-tags/tag-list"
import { Button } from "@/components/ui/button"
import { toastManager } from "@/components/ui/toast"
import { useCategories } from "@/hooks/use-categories"
import { useTags } from "@/hooks/use-tags"
import { queryApi } from "@/lib/orpc/query"

interface CategoryDialogState {
  open: boolean
  editing: { id: string; name: string; description?: string | null } | null
  name: string
  description: string
}

interface TagDialogState {
  open: boolean
  editing: { id: string; name: string } | null
  name: string
}

interface State {
  categoryDialog: CategoryDialogState
  tagDialog: TagDialogState
}

type Action =
  | {
      type: "OPEN_CATEGORY_DIALOG"
      category?: { id: string; name: string; description?: string | null }
    }
  | { type: "CLOSE_CATEGORY_DIALOG" }
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_CATEGORY_DESCRIPTION"; payload: string }
  | { type: "OPEN_TAG_DIALOG"; tag?: { id: string; name: string } }
  | { type: "CLOSE_TAG_DIALOG" }
  | { type: "SET_TAG_NAME"; payload: string }
  | { type: "RESET_CATEGORY_FORM" }
  | { type: "RESET_TAG_FORM" }

const initialState: State = {
  categoryDialog: {
    open: false,
    editing: null,
    name: "",
    description: "",
  },
  tagDialog: {
    open: false,
    editing: null,
    name: "",
  },
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN_CATEGORY_DIALOG":
      return {
        ...state,
        categoryDialog: {
          open: true,
          editing: action.category ?? null,
          name: action.category?.name ?? "",
          description: action.category?.description ?? "",
        },
      }
    case "CLOSE_CATEGORY_DIALOG":
      return {
        ...state,
        categoryDialog: { ...state.categoryDialog, open: false },
      }
    case "SET_CATEGORY_NAME":
      return {
        ...state,
        categoryDialog: { ...state.categoryDialog, name: action.payload },
      }
    case "SET_CATEGORY_DESCRIPTION":
      return {
        ...state,
        categoryDialog: {
          ...state.categoryDialog,
          description: action.payload,
        },
      }
    case "OPEN_TAG_DIALOG":
      return {
        ...state,
        tagDialog: {
          open: true,
          editing: action.tag ?? null,
          name: action.tag?.name ?? "",
        },
      }
    case "CLOSE_TAG_DIALOG":
      return {
        ...state,
        tagDialog: { ...state.tagDialog, open: false },
      }
    case "SET_TAG_NAME":
      return {
        ...state,
        tagDialog: { ...state.tagDialog, name: action.payload },
      }
    case "RESET_CATEGORY_FORM":
      return {
        ...state,
        categoryDialog: {
          open: false,
          editing: null,
          name: "",
          description: "",
        },
      }
    case "RESET_TAG_FORM":
      return {
        ...state,
        tagDialog: {
          open: false,
          editing: null,
          name: "",
        },
      }
    default:
      return state
  }
}

const CategoriesTagsContent = () => {
  const queryClient = useQueryClient()
  const { data: categories, isLoading: isLoadingCategories } = useCategories()
  const { data: tags, isLoading: isLoadingTags } = useTags()
  const [state, dispatch] = useReducer(reducer, initialState)

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.categories.create.call({
        name: state.categoryDialog.name,
        description: state.categoryDialog.description || undefined,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Category created",
        description: `${state.categoryDialog.name} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      dispatch({ type: "RESET_CATEGORY_FORM" })
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
      if (!state.categoryDialog.editing) return
      return await queryApi.categories.update.call({
        id: state.categoryDialog.editing.id,
        name: state.categoryDialog.name,
        description: state.categoryDialog.description || undefined,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Category updated",
        description: `${state.categoryDialog.name} has been updated successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      dispatch({ type: "RESET_CATEGORY_FORM" })
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
        name: state.tagDialog.name,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tag created",
        description: `${state.tagDialog.name} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
      dispatch({ type: "RESET_TAG_FORM" })
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
      if (!state.tagDialog.editing) return
      return await queryApi.tags.update.call({
        id: state.tagDialog.editing.id,
        name: state.tagDialog.name,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Tag updated",
        description: `${state.tagDialog.name} has been updated successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
      dispatch({ type: "RESET_TAG_FORM" })
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

  const handleCategorySubmit = () => {
    if (state.categoryDialog.editing) {
      updateCategoryMutation.mutate()
    } else {
      createCategoryMutation.mutate()
    }
  }

  const handleTagSubmit = () => {
    if (state.tagDialog.editing) {
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
            <Button
              size="sm"
              onClick={() => dispatch({ type: "OPEN_CATEGORY_DIALOG" })}
            >
              <PlusIcon className="size-4" />
              Add Category
            </Button>
          </div>
          <CategoryList
            categories={categories}
            isLoading={isLoadingCategories}
            onEdit={(category) =>
              dispatch({ type: "OPEN_CATEGORY_DIALOG", category })
            }
            onDelete={(id) => deleteCategoryMutation.mutate(id)}
            deleteMutation={deleteCategoryMutation}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tags</h2>
            <Button
              size="sm"
              onClick={() => dispatch({ type: "OPEN_TAG_DIALOG" })}
            >
              <PlusIcon className="size-4" />
              Add Tag
            </Button>
          </div>
          <TagList
            tags={tags}
            isLoading={isLoadingTags}
            onEdit={(tag) => dispatch({ type: "OPEN_TAG_DIALOG", tag })}
            onDelete={(id) => deleteTagMutation.mutate(id)}
            deleteMutation={deleteTagMutation}
          />
        </div>
      </div>

      <CategoryDialog
        open={state.categoryDialog.open}
        editing={state.categoryDialog.editing}
        name={state.categoryDialog.name}
        description={state.categoryDialog.description}
        onOpenChange={(open) =>
          open
            ? dispatch({ type: "OPEN_CATEGORY_DIALOG" })
            : dispatch({ type: "CLOSE_CATEGORY_DIALOG" })
        }
        onNameChange={(value) =>
          dispatch({ type: "SET_CATEGORY_NAME", payload: value })
        }
        onDescriptionChange={(value) =>
          dispatch({ type: "SET_CATEGORY_DESCRIPTION", payload: value })
        }
        onSubmit={handleCategorySubmit}
        onCancel={() => dispatch({ type: "RESET_CATEGORY_FORM" })}
        createMutation={createCategoryMutation}
        updateMutation={updateCategoryMutation}
      />

      <TagDialog
        open={state.tagDialog.open}
        editing={state.tagDialog.editing}
        name={state.tagDialog.name}
        onOpenChange={(open) =>
          open
            ? dispatch({ type: "OPEN_TAG_DIALOG" })
            : dispatch({ type: "CLOSE_TAG_DIALOG" })
        }
        onNameChange={(value) =>
          dispatch({ type: "SET_TAG_NAME", payload: value })
        }
        onSubmit={handleTagSubmit}
        onCancel={() => dispatch({ type: "RESET_TAG_FORM" })}
        createMutation={createTagMutation}
        updateMutation={updateTagMutation}
      />
    </div>
  )
}

export default function CategoriesTagsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 p-8">
          <Shimmer loading={true}>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
              <p className="text-muted-foreground mt-2">
                Loading categories and tags...
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Categories</h2>
                <div className="border-border rounded-lg border p-4">
                  Loading...
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Tags</h2>
                <div className="border-border rounded-lg border p-4">
                  Loading...
                </div>
              </div>
            </div>
          </Shimmer>
        </div>
      }
    >
      <CategoriesTagsContent />
    </Suspense>
  )
}
