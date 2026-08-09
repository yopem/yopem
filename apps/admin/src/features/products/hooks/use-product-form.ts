"use client"

import type { TElement } from "platejs"

import { useForm, useSelector } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useEffectEvent, useMemo, useState } from "react"
import * as v from "valibot"

import {
  productWorkflowSchema,
  type ProductWorkflow,
} from "db/schema/product-workflow"
import { createDefaultWorkflow } from "db/schema/product-workflow-utils"
import { insertProductSchema, type SelectProduct } from "db/schema/products"
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
    "creditsPerRun",
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
  slug: v.optional(v.string()),
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

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)

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
        setCategoryDialogOpen(false)
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
        setTagDialogOpen(false)
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

  const initialDescriptionContent = useMemo(
    () => getInitialDescriptionContent(initialData),
    [initialData],
  )

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      descriptionContent: initialDescriptionContent,
      excerpt: "",
      workflow: defaultWorkflow,
      outputFormat: "plain" as "plain" | "json" | "image" | "video",
      creditsPerRun: 0,
      apiKeyId: "",
      apiKeyError: "",
      categoryIds: [] as string[],
      tagIds: [] as string[],
      thumbnailId: undefined as string | undefined,
    },
    onSubmit: ({ value }) => {
      const formData = buildFormData(value)

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

  const formValues = useSelector(form.store, (state) => state.values)

  const selectedApiKeyProvider = useMemo(() => {
    if (!formValues.apiKeyId || !safeApiKeys) return undefined
    const key = safeApiKeys.find((k) => k.id === formValues.apiKeyId)
    return key?.provider
  }, [formValues.apiKeyId, safeApiKeys])

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

  const categories = categoriesData ?? []
  const tags = tagsData ?? []

  const getFormValues = (): ProductFormData => buildFormData(form.state.values)

  useEffect(() => {
    const workflow = form.getFieldValue("workflow")
    if (availableModels.length === 0 || getDefaultModelFromWorkflow(workflow)) {
      return
    }
    const aiIndex = workflow.nodes.findIndex((n) => n.type === "ai")
    if (aiIndex === -1) return
    const aiNode = workflow.nodes[aiIndex]
    if (aiNode.type !== "ai" || aiNode.data.modelEngine) return
    form.setFieldValue("workflow", {
      ...workflow,
      nodes: workflow.nodes.map((n, index) =>
        index === aiIndex && n.type === "ai"
          ? { ...n, data: { ...n.data, modelEngine: availableModels[0] } }
          : n,
      ),
    })
  }, [availableModels, form])

  const onInitialDataLoaded = useEffectEvent(() => {
    if (mode === "edit" && initialData) {
      form.setFieldValue("name", initialData.name)
      form.setFieldValue("slug", initialData.slug ?? "")
      form.setFieldValue("description", initialData.description ?? "")
      form.setFieldValue("excerpt", initialData.excerpt ?? "")

      if (initialData.workflow && typeof initialData.workflow === "object") {
        form.setFieldValue("workflow", structuredClone(initialData.workflow))
      }

      if (initialData.outputFormat) {
        form.setFieldValue("outputFormat", initialData.outputFormat)
      }

      if (initialData.creditsPerRun !== undefined) {
        form.setFieldValue("creditsPerRun", initialData.creditsPerRun)
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

  useEffect(() => {
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
  }, [
    formValues.apiKeyId,
    formValues.workflow,
    safeApiKeys,
    availableModelsData,
    form,
  ])

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
    categoryDialogOpen,
    setCategoryDialogOpen,
    tagDialogOpen,
    setTagDialogOpen,
    createCategoryMutation,
    createTagMutation,
    handleWorkflowChange,
  }
}

function getInitialDescriptionContent(initialData?: SelectProduct): TElement[] {
  if (!initialData) return []
  const existingContent = initialData.descriptionContent
  const hasContent =
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
  if (hasContent) return structuredClone(existingContent) as TElement[]
  if (initialData.description) {
    return deserializeHtmlToSlate(initialData.description)
  }
  return []
}

function getDefaultModelFromWorkflow(workflow: ProductWorkflow): string {
  const aiNode = workflow.nodes.find((n) => n.type === "ai")
  if (aiNode?.type === "ai" && aiNode.data.modelEngine) {
    return aiNode.data.modelEngine
  }
  return ""
}

interface ProductFormValues {
  name: string
  slug: string
  description: string
  descriptionContent: TElement[]
  excerpt: string
  workflow: ProductWorkflow
  outputFormat: "plain" | "json" | "image" | "video"
  creditsPerRun: number
  apiKeyId: string
  apiKeyError: string
  categoryIds: string[]
  tagIds: string[]
  thumbnailId?: string
}

function buildFormData(values: ProductFormValues): ProductFormData {
  return {
    name: values.name,
    slug: values.slug || undefined,
    description: values.description,
    descriptionContent: values.descriptionContent,
    excerpt: values.excerpt || undefined,
    workflow: values.workflow,
    outputFormat: values.outputFormat,
    creditsPerRun: values.creditsPerRun,
    config: {
      modelEngine: getDefaultModelFromWorkflow(values.workflow),
    },
    status: "draft" as const,
    apiKeyId: values.apiKeyId,
    ...(values.categoryIds &&
      values.categoryIds.length > 0 && {
        categoryIds: values.categoryIds,
      }),
    ...(values.tagIds &&
      values.tagIds.length > 0 && {
        tagIds: values.tagIds,
      }),
    ...(values.thumbnailId && {
      thumbnailId: values.thumbnailId,
    }),
  }
}
