import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"
import { useEffect, useReducer, useRef } from "react"
import * as v from "valibot"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { toastManager } from "ui/toast"

import { CategoryDialog } from "@/components/categories-tags/category-dialog"
import { CategoryList } from "@/components/categories-tags/category-list"
import { TagDialog } from "@/components/categories-tags/tag-dialog"
import { TagList } from "@/components/categories-tags/tag-list"
import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"

const categoriesTagsSearchSchema = v.object({
  categoryId: v.optional(v.string()),
  tagId: v.optional(v.string()),
})

export const Route = createFileRoute("/(admin-console)/categories-tags/")({
  validateSearch: categoriesTagsSearchSchema,
  component: CategoriesTagsRouteComponent,
})

interface CategoryDialogState {
  open: boolean
  editing: {
    id: string
    name: string
    slug?: string | null
    description?: string | null
    parentId?: string | null
  } | null
}

interface TagDialogState {
  open: boolean
  editing: { id: string; name: string } | null
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
        slug?: string | null
        description?: string | null
        parentId?: string | null
      }
    }
  | { type: "OPEN_TAG_DIALOG"; tag?: { id: string; name: string } }
  | { type: "RESET_CATEGORY_FORM" }
  | { type: "RESET_TAG_FORM" }

function CategoriesTagsRouteComponent() {
  const initialState: State = {
    categoryDialog: { open: false, editing: null },
    tagDialog: { open: false, editing: null },
  }

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "OPEN_CATEGORY_DIALOG":
        return {
          ...state,
          categoryDialog: {
            open: true,
            editing: action.category ?? null,
          },
        }
      case "OPEN_TAG_DIALOG":
        return {
          ...state,
          tagDialog: {
            open: true,
            editing: action.tag ?? null,
          },
        }
      case "RESET_CATEGORY_FORM":
        return {
          ...state,
          categoryDialog: { open: false, editing: null },
        }
      case "RESET_TAG_FORM":
        return {
          ...state,
          tagDialog: { open: false, editing: null },
        }
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const search = Route.useSearch()

  const openedCategoryFromSearch = useRef<string | null>(null)
  const openedTagFromSearch = useRef<string | null>(null)

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    queryApi.categories.list.queryOptions(),
  )

  const { data: tags, isLoading: isLoadingTags } = useQuery(
    queryApi.tags.list.queryOptions(),
  )

  useEffect(() => {
    if (!search.categoryId || !categories) {
      openedCategoryFromSearch.current = null
      return
    }
    if (openedCategoryFromSearch.current === search.categoryId) return
    const category = categories.find((c) => c.id === search.categoryId)
    if (!category) return
    openedCategoryFromSearch.current = search.categoryId
    dispatch({ type: "OPEN_CATEGORY_DIALOG", category })
  }, [search.categoryId, categories])

  useEffect(() => {
    if (!search.tagId || !tags) {
      openedTagFromSearch.current = null
      return
    }
    if (openedTagFromSearch.current === search.tagId) return
    const tag = tags.find((t) => t.id === search.tagId)
    if (!tag) return
    openedTagFromSearch.current = search.tagId
    dispatch({ type: "OPEN_TAG_DIALOG", tag })
  }, [search.tagId, tags])

  const handleCategoryOpenChange = (open: boolean) => {
    if (open) {
      dispatch({ type: "OPEN_CATEGORY_DIALOG" })
      return
    }
    dispatch({ type: "RESET_CATEGORY_FORM" })
    if (search.categoryId) {
      void navigate({ to: "/categories-tags", search: { tagId: search.tagId } })
    }
  }

  const handleTagOpenChange = (open: boolean) => {
    if (open) {
      dispatch({ type: "OPEN_TAG_DIALOG" })
      return
    }
    dispatch({ type: "RESET_TAG_FORM" })
    if (search.tagId) {
      void navigate({
        to: "/categories-tags",
        search: { categoryId: search.categoryId },
      })
    }
  }

  const createCategoryMutation = useMutation(
    queryApi.categories.create.mutationOptions({
      onSuccess: (_value, variables) => {
        toastManager.add({
          title: "Category created",
          description: `${variables.name} has been created successfully.`,
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
      onSuccess: (_value, variables) => {
        toastManager.add({
          title: "Category updated",
          description: `${variables.name} has been updated successfully.`,
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
      onSuccess: (_value, variables) => {
        toastManager.add({
          title: "Tag created",
          description: `${variables.name} has been created successfully.`,
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
      onSuccess: (_value, variables) => {
        toastManager.add({
          title: "Tag updated",
          description: `${variables.name} has been updated successfully.`,
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

  const handleCategorySubmit = (values: {
    name: string
    slug?: string
    description?: string
    parentId?: string
  }) => {
    if (state.categoryDialog.editing) {
      updateCategoryMutation.mutate({
        id: state.categoryDialog.editing.id,
        ...values,
      })
    } else {
      createCategoryMutation.mutate(values)
    }
  }

  const handleTagSubmit = (values: { name: string }) => {
    if (state.tagDialog.editing) {
      updateTagMutation.mutate({
        id: state.tagDialog.editing.id,
        ...values,
      })
    } else {
      createTagMutation.mutate(values)
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
              dispatch({
                type: "OPEN_CATEGORY_DIALOG",
                category: categories?.find((c) => c.id === category.id),
              })
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
            onEdit={(tag) =>
              dispatch({
                type: "OPEN_TAG_DIALOG",
                tag: tags?.find((t) => t.id === tag.id),
              })
            }
            onDelete={(id) => deleteTagMutation.mutate({ id })}
            deleteMutation={deleteTagMutation}
          />
        </div>
      </div>

      <CategoryDialog
        open={state.categoryDialog.open}
        editing={state.categoryDialog.editing}
        categories={categories ?? []}
        onOpenChange={handleCategoryOpenChange}
        onSubmit={handleCategorySubmit}
        onCancel={() => handleCategoryOpenChange(false)}
        createMutation={createCategoryMutation}
        updateMutation={updateCategoryMutation}
      />

      <TagDialog
        open={state.tagDialog.open}
        editing={state.tagDialog.editing}
        onOpenChange={handleTagOpenChange}
        onSubmit={handleTagSubmit}
        onCancel={() => handleTagOpenChange(false)}
        createMutation={createTagMutation}
        updateMutation={updateTagMutation}
      />
    </div>
  )
}
