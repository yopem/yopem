import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useReducer } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import { CategoryDialog } from "@/components/categories-tags/category-dialog"
import { CategoryList } from "@/components/categories-tags/category-list"
import { TagDialog } from "@/components/categories-tags/tag-dialog"
import { TagList } from "@/components/categories-tags/tag-list"
import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"

export const Route = createFileRoute("/(admin-console)/categories-tags/")({
  component: CategoriesTagsRouteComponent,
})

interface CategoryDialogState {
  open: boolean
  editing: { id: string; name: string; description?: string | null } | null
  name: string
  description: string
  parentId: string | undefined
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
      category?: {
        id: string
        name: string
        description?: string | null
        parentId?: string | null
      }
    }
  | { type: "CLOSE_CATEGORY_DIALOG" }
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_CATEGORY_DESCRIPTION"; payload: string }
  | { type: "SET_CATEGORY_PARENT_ID"; payload: string | undefined }
  | { type: "OPEN_TAG_DIALOG"; tag?: { id: string; name: string } }
  | { type: "CLOSE_TAG_DIALOG" }
  | { type: "SET_TAG_NAME"; payload: string }
  | { type: "RESET_CATEGORY_FORM" }
  | { type: "RESET_TAG_FORM" }

function CategoriesTagsRouteComponent() {
  const initialState: State = {
    categoryDialog: {
      open: false,
      editing: null,
      name: "",
      description: "",
      parentId: undefined,
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
            parentId: action.category?.parentId ?? undefined,
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
      case "SET_CATEGORY_PARENT_ID":
        return {
          ...state,
          categoryDialog: {
            ...state.categoryDialog,
            parentId: action.payload,
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
            parentId: undefined,
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

  const [state, dispatch] = useReducer(reducer, initialState)

  const queryClient = useQueryClient()

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    queryApi.categories.list.queryOptions(),
  )

  const { data: tags, isLoading: isLoadingTags } = useQuery(
    queryApi.tags.list.queryOptions(),
  )

  const createCategoryMutation = useMutation(
    queryApi.categories.create.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Category created",
          description: `${state.categoryDialog.name} has been created successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.categories.list.queryKey(),
        })
        dispatch({ type: "RESET_CATEGORY_FORM" })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error creating category",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const updateCategoryMutation = useMutation(
    queryApi.categories.update.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Category updated",
          description: `${state.categoryDialog.name} has been updated successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.categories.list.queryKey(),
        })
        dispatch({ type: "RESET_CATEGORY_FORM" })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error updating category",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const deleteCategoryMutation = useMutation(
    queryApi.categories.delete.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Category deleted",
          description: "Category has been deleted successfully.",
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.categories.list.queryKey(),
        })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error deleting category",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const createTagMutation = useMutation(
    queryApi.tags.create.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Tag created",
          description: `${state.tagDialog.name} has been created successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.tags.list.queryKey(),
        })
        dispatch({ type: "RESET_TAG_FORM" })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error creating tag",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const updateTagMutation = useMutation(
    queryApi.tags.update.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Tag updated",
          description: `${state.tagDialog.name} has been updated successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.tags.list.queryKey(),
        })
        dispatch({ type: "RESET_TAG_FORM" })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error updating tag",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const deleteTagMutation = useMutation(
    queryApi.tags.delete.mutationOptions({
      onSuccess: () => {
        toastManager.add({
          title: "Tag deleted",
          description: "Tag has been deleted successfully.",
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.tags.list.queryKey(),
        })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error deleting tag",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const handleCategorySubmit = () => {
    if (state.categoryDialog.editing) {
      updateCategoryMutation.mutate({
        id: state.categoryDialog.editing.id,
        name: state.categoryDialog.name,
        description: state.categoryDialog.description || undefined,
        parentId: state.categoryDialog.parentId,
      })
    } else {
      createCategoryMutation.mutate({
        name: state.categoryDialog.name,
        description: state.categoryDialog.description || undefined,
        parentId: state.categoryDialog.parentId,
      })
    }
  }

  const handleTagSubmit = () => {
    if (state.tagDialog.editing) {
      updateTagMutation.mutate({
        id: state.tagDialog.editing.id,
        name: state.tagDialog.name,
      })
    } else {
      createTagMutation.mutate({
        name: state.tagDialog.name,
      })
    }
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories & Tags" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <GlobalBreadcrumb items={breadcrumbItems} />
      <GlobalPageHeader
        title="Categories & Tags"
        description="Manage categories and tags for organizing your products"
      />

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
            onDelete={(id) => deleteCategoryMutation.mutate({ id })}
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
            onDelete={(id) => deleteTagMutation.mutate({ id })}
            deleteMutation={deleteTagMutation}
          />
        </div>
      </div>

      <CategoryDialog
        open={state.categoryDialog.open}
        editing={state.categoryDialog.editing}
        name={state.categoryDialog.name}
        description={state.categoryDialog.description}
        parentId={state.categoryDialog.parentId}
        categories={categories ?? []}
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
        onParentIdChange={(value) =>
          dispatch({ type: "SET_CATEGORY_PARENT_ID", payload: value })
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
