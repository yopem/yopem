"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useEffectEvent, useMemo, useReducer } from "react"
import * as v from "valibot"

import {
  insertProductSchema,
  type SelectProduct,
  createDefaultWorkflow,
  getInputFieldsFromWorkflow,
  productWorkflowSchema,
  type ProductWorkflow,
} from "db/schema"
import type { TElement } from "editor"
import { deserializeHtmlToSlate } from "editor/serialize"
import { queryApi } from "rpc/query"
import { toastManager } from "ui/toast"
import type { ApiKeyConfig } from "utils/api-input"

import { validateModelProviderMatch } from "@/lib/utils/provider"

const productFormSchema = v.object({
  ...v.pick(insertProductSchema, [
    "name",
    "description",
    "excerpt",
    "outputFormat",
    "costPerRun",
    "config",
    "status",
    "apiKeyId",
    "categoryIds",
    "tagIds",
    "thumbnailId",
  ]).entries,
  name: v.pipe(
    v.string(),
    v.minLength(1, "Product name is required"),
    v.trim(),
  ),
  description: v.pipe(
    v.string(),
    v.minLength(1, "Product description is required"),
    v.trim(),
  ),
  descriptionContent: v.pipe(
    v.array(v.record(v.string(), v.unknown())),
    v.check((value) => {
      if (value.length === 0) return false
      const isEmptySingleParagraph =
        value.length === 1 &&
        (value[0] as { type?: string })?.type === "p" &&
        (
          (value[0] as { children?: { text?: string }[] })?.children ?? []
        ).every((child) => (child.text ?? "") === "")
      return !isEmptySingleParagraph
    }, "Product description is required"),
  ),
  excerpt: v.optional(v.pipe(v.string(), v.maxLength(500))),
  workflow: productWorkflowSchema,
  apiKeyId: v.pipe(v.string(), v.minLength(1, "API key is required")),
  categoryIds: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.string())),
  thumbnailId: v.optional(v.string()),
})

export type ProductFormData = v.InferOutput<typeof productFormSchema>

export interface ProductFormRef {
  submit: () => void
  getValues: () => ProductFormData
}

const EMPTY_API_KEYS: ApiKeyConfig[] = []

interface DialogState {
  open: boolean
  name: string
  description?: string
  parentId?: string
}

interface TagDialogState {
  open: boolean
  name: string
}

interface ProductFormDialogsState {
  category: DialogState
  tag: TagDialogState
}

type ProductFormDialogsAction =
  | { type: "OPEN_CATEGORY_DIALOG" }
  | { type: "CLOSE_CATEGORY_DIALOG" }
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_CATEGORY_DESCRIPTION"; payload: string }
  | { type: "SET_CATEGORY_PARENT_ID"; payload: string }
  | { type: "RESET_CATEGORY_FORM" }
  | { type: "OPEN_TAG_DIALOG" }
  | { type: "CLOSE_TAG_DIALOG" }
  | { type: "SET_TAG_NAME"; payload: string }
  | { type: "RESET_TAG_FORM" }

const dialogsInitialState: ProductFormDialogsState = {
  category: { open: false, name: "", description: "", parentId: "" },
  tag: { open: false, name: "" },
}

function dialogsReducer(
  state: ProductFormDialogsState,
  action: ProductFormDialogsAction,
): ProductFormDialogsState {
  switch (action.type) {
    case "OPEN_CATEGORY_DIALOG":
      return {
        ...state,
        category: { ...state.category, open: true },
      }
    case "CLOSE_CATEGORY_DIALOG":
      return {
        ...state,
        category: { ...state.category, open: false },
      }
    case "SET_CATEGORY_NAME":
      return {
        ...state,
        category: { ...state.category, name: action.payload },
      }
    case "SET_CATEGORY_DESCRIPTION":
      return {
        ...state,
        category: {
          ...state.category,
          description: action.payload,
        },
      }
    case "SET_CATEGORY_PARENT_ID":
      return {
        ...state,
        category: {
          ...state.category,
          parentId: action.payload,
        },
      }
    case "RESET_CATEGORY_FORM":
      return {
        ...state,
        category: { open: false, name: "", description: "", parentId: "" },
      }
    case "OPEN_TAG_DIALOG":
      return { ...state, tag: { ...state.tag, open: true } }
    case "CLOSE_TAG_DIALOG":
      return { ...state, tag: { ...state.tag, open: false } }
    case "SET_TAG_NAME":
      return { ...state, tag: { ...state.tag, name: action.payload } }
    case "RESET_TAG_FORM":
      return { ...state, tag: { open: false, name: "" } }
    default:
      return state
  }
}

interface UseProductFormOptions {
  mode: "create" | "edit"
  initialData?: SelectProduct
  onSubmit: (data: ProductFormData) => void | Promise<void>
  apiKeys?: ApiKeyConfig[]
}

export function useProductForm({
  mode,
  initialData,
  onSubmit,
  apiKeys,
}: UseProductFormOptions) {
  const queryClient = useQueryClient()
  const safeApiKeys = apiKeys ?? EMPTY_API_KEYS

  const { data: availableModelsData } = useQuery(
    queryApi.admin.modelList.queryOptions({
      staleTime: 5 * 60 * 1000,
    }),
  )

  const { data: categoriesData } = useQuery(
    queryApi.categories.list.queryOptions(),
  )

  const { data: tagsData } = useQuery(queryApi.tags.list.queryOptions())

  const [dialogsState, dialogsDispatch] = useReducer(
    dialogsReducer,
    dialogsInitialState,
  )

  const createCategoryMutation = useMutation(
    queryApi.categories.create.mutationOptions({
      onSuccess: (value, variables) => {
        toastManager.add({
          title: "Category created",
          description: `${variables.name} has been created successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.categories.list.queryKey(),
        })
        const currentCategoryIds = form.getFieldValue("categoryIds")
        form.setFieldValue("categoryIds", [...currentCategoryIds, value.id])
        dialogsDispatch({ type: "RESET_CATEGORY_FORM" })
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

  const createTagMutation = useMutation(
    queryApi.tags.create.mutationOptions({
      onSuccess: (value, variables) => {
        toastManager.add({
          title: "Tag created",
          description: `${variables.name} has been created successfully.`,
          type: "success",
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.tags.list.queryKey(),
        })
        const currentTagIds = form.getFieldValue("tagIds")
        form.setFieldValue("tagIds", [...currentTagIds, value.id])
        dialogsDispatch({ type: "RESET_TAG_FORM" })
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

  const defaultWorkflow = useMemo(() => createDefaultWorkflow("", "plain"), [])

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      descriptionContent: [] as TElement[],
      excerpt: "",
      workflow: defaultWorkflow,
      outputFormat: "plain" as "plain" | "json" | "image" | "video",
      costPerRun: mode === "create" ? 0 : 0.05,
      markup: 0.2,
      apiKeyId: "",
      apiKeyError: "",
      categoryIds: [] as string[],
      tagIds: [] as string[],
      thumbnailId: undefined as string | undefined,
    },
    onSubmit: ({ value }) => {
      const formData = {
        name: value.name,
        description: value.description,
        descriptionContent: value.descriptionContent,
        excerpt: value.excerpt || undefined,
        workflow: value.workflow,
        outputFormat: value.outputFormat,
        costPerRun: String(value.costPerRun),
        config: {
          modelEngine: getDefaultModelFromWorkflow(value.workflow),
        },
        status: "draft" as const,
        apiKeyId: value.apiKeyId,
        ...(value.categoryIds &&
          value.categoryIds.length > 0 && {
            categoryIds: value.categoryIds,
          }),
        ...(value.tagIds &&
          value.tagIds.length > 0 && {
            tagIds: value.tagIds,
          }),
        thumbnailId: value.thumbnailId,
      }

      const result = v.safeParse(productFormSchema, formData)

      if (!result.success) {
        const firstError = result.issues[0]
        toastManager.add({
          title: "Validation Error",
          description: firstError.message,
          type: "error",
        })
        return
      }

      void onSubmit(formData)
    },
  })

  const selectedApiKeyProvider = useMemo(() => {
    if (!form.state.values.apiKeyId || !safeApiKeys) return undefined
    const key = safeApiKeys.find((k) => k.id === form.state.values.apiKeyId)
    return key?.provider
  }, [form.state.values.apiKeyId, safeApiKeys])

  const availableModels = useMemo(() => {
    if (!availableModelsData || availableModelsData.length === 0) {
      return []
    }

    let filtered = availableModelsData.filter((m) => m.isEnabled)

    if (selectedApiKeyProvider) {
      filtered = filtered.filter((m) => m.provider === selectedApiKeyProvider)
    }

    return filtered.map((model) => model.modelId)
  }, [availableModelsData, selectedApiKeyProvider])

  const categories = useMemo(() => {
    if (!categoriesData || categoriesData.length === 0) {
      return []
    }
    return categoriesData
  }, [categoriesData])

  const tags = useMemo(() => {
    if (!tagsData || tagsData.length === 0) {
      return []
    }
    return tagsData
  }, [tagsData])

  const inputFields = useMemo(
    () => getInputFieldsFromWorkflow(form.state.values.workflow),
    [form.state.values.workflow],
  )

  const getFormValues = (): ProductFormData => {
    const formData = form.state.values
    return {
      name: formData.name,
      description: formData.description,
      descriptionContent: formData.descriptionContent,
      excerpt: formData.excerpt || undefined,
      workflow: formData.workflow,
      outputFormat: formData.outputFormat,
      costPerRun: String(formData.costPerRun),
      config: {
        modelEngine: getDefaultModelFromWorkflow(formData.workflow),
      },
      status: "draft" as const,
      apiKeyId: formData.apiKeyId,
      ...(formData.categoryIds &&
        formData.categoryIds.length > 0 && {
          categoryIds: formData.categoryIds,
        }),
      ...(formData.tagIds &&
        formData.tagIds.length > 0 && {
          tagIds: formData.tagIds,
        }),
      ...(formData.thumbnailId && {
        thumbnailId: formData.thumbnailId,
      }),
    }
  }

  const onModelsAvailable = useEffectEvent(() => {
    const workflow = form.getFieldValue("workflow")
    const currentModel = getDefaultModelFromWorkflow(workflow)
    if (availableModels.length > 0 && !currentModel) {
      const firstAiNode = workflow.nodes.find((n) => n.type === "ai")
      if (firstAiNode?.type === "ai") {
        firstAiNode.data.modelEngine = availableModels[0]
        form.setFieldValue("workflow", { ...workflow })
      }
    }
  })

  useEffect(() => {
    onModelsAvailable()
  }, [availableModels])

  const onInitialDataLoaded = useEffectEvent(() => {
    if (mode === "edit" && initialData) {
      form.setFieldValue("name", initialData.name)
      form.setFieldValue("description", initialData.description ?? "")
      const existingContent = (
        initialData as { descriptionContent?: TElement[] }
      ).descriptionContent
      const hasContent =
        existingContent &&
        Array.isArray(existingContent) &&
        existingContent.some(
          (node) =>
            node &&
            typeof node === "object" &&
            (("children" in node &&
              Array.isArray(node.children) &&
              node.children.length > 0) ||
              ("text" in node &&
                typeof node.text === "string" &&
                node.text.trim() !== "")),
        )
      if (hasContent) {
        form.setFieldValue("descriptionContent", existingContent)
      } else if (initialData.description) {
        form.setFieldValue(
          "descriptionContent",
          deserializeHtmlToSlate(initialData.description),
        )
      }
      form.setFieldValue("excerpt", initialData.excerpt ?? "")

      if (initialData.workflow && typeof initialData.workflow === "object") {
        form.setFieldValue("workflow", initialData.workflow)
      }

      if (initialData.outputFormat) {
        form.setFieldValue("outputFormat", initialData.outputFormat)
      }

      if (initialData.costPerRun) {
        form.setFieldValue("costPerRun", Number(initialData.costPerRun))
      }

      if (initialData.markup) {
        form.setFieldValue("markup", Number(initialData.markup))
      }

      if (initialData.apiKeyId) {
        form.setFieldValue("apiKeyId", initialData.apiKeyId)
      }

      if (
        "categories" in initialData &&
        Array.isArray(initialData.categories) &&
        initialData.categories.length > 0
      ) {
        form.setFieldValue(
          "categoryIds",
          initialData.categories.map((cat: { id: string }) => cat.id),
        )
      }

      if (
        "tags" in initialData &&
        Array.isArray(initialData.tags) &&
        initialData.tags.length > 0
      ) {
        form.setFieldValue(
          "tagIds",
          initialData.tags.map((tag: { id: string }) => tag.id),
        )
      }

      if ("thumbnail" in initialData && initialData.thumbnail) {
        form.setFieldValue("thumbnailId", initialData.thumbnail.id)
      }
    }
  })

  useEffect(() => {
    onInitialDataLoaded()
  }, [initialData, mode])

  const onApiKeyOrModelChange = useEffectEvent(() => {
    const apiKeyId = form.getFieldValue("apiKeyId")
    const modelEngine = getDefaultModelFromWorkflow(
      form.getFieldValue("workflow"),
    )

    if (apiKeyId && modelEngine) {
      const selectedKey = safeApiKeys.find((key) => key.id === apiKeyId)
      if (selectedKey) {
        const result = validateModelProviderMatch(
          selectedKey.provider,
          modelEngine,
          availableModelsData ?? [],
        )
        if (!result.valid) {
          form.setFieldValue(
            "apiKeyError",
            result.message ?? "Model/provider mismatch",
          )
        } else {
          form.setFieldValue("apiKeyError", "")
        }
      }
    }
  })

  useEffect(() => {
    onApiKeyOrModelChange()
  }, [form.state.values.apiKeyId, form.state.values.workflow, safeApiKeys])

  const handleWorkflowChange = (workflow: ProductWorkflow) => {
    form.setFieldValue("workflow", workflow)
  }

  return {
    form,
    getFormValues,
    safeApiKeys,
    availableModels,
    categories,
    tags,
    inputFields,
    dialogsState,
    dialogsDispatch,
    createCategoryMutation,
    createTagMutation,
    handleWorkflowChange,
  }
}

function getDefaultModelFromWorkflow(workflow: ProductWorkflow): string {
  const aiNode = workflow.nodes.find((n) => n.type === "ai")
  if (aiNode?.type === "ai" && aiNode.data.modelEngine) {
    return aiNode.data.modelEngine
  }
  return ""
}
