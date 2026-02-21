"use client"

import { queryApi } from "@repo/api/orpc/query"
import type { ApiKeyConfig } from "@repo/api/schemas/api-keys"
import { insertToolSchema, type SelectTool } from "@repo/db/schema"
import { toastManager } from "@repo/ui/toast"
import {
  getProviderMismatchMessage,
  validateModelProviderMatch,
} from "@repo/utils/model-provider-validation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react"
import { z } from "zod"

import { useAvailableModels } from "@/hooks/use-available-models"
import { useCategories } from "@/hooks/use-categories"
import { useTags } from "@/hooks/use-tags"

import type { InputFieldType, SelectOption } from "./input-variable-row"

const toolFormSchema = insertToolSchema
  .pick({
    name: true,
    description: true,
    excerpt: true,
    systemRole: true,
    userInstructionTemplate: true,
    inputVariable: true,
    outputFormat: true,
    costPerRun: true,
    config: true,
    status: true,
    apiKeyId: true,
    categoryIds: true,
    tagIds: true,
    thumbnailId: true,
  })
  .extend({
    name: z.string().min(1, "Tool name is required").trim(),
    description: z.string().min(1, "Tool description is required").trim(),
    excerpt: z.string().max(500).optional(),
    systemRole: z.string().min(1, "System role is required").trim(),
    userInstructionTemplate: z
      .string()
      .min(1, "User instruction template is required")
      .trim(),
    inputVariable: z
      .array(
        z.object({
          variableName: z.string().min(1),
          type: z.enum([
            "text",
            "long_text",
            "number",
            "boolean",
            "select",
            "image",
            "video",
          ]),
          description: z.string(),
          options: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
              }),
            )
            .optional(),
          isOptional: z.boolean().optional(),
        }),
      )
      .min(1, "At least one input field is required")
      .refine(
        (fields) => {
          return fields.every((field) => {
            if (field.type === "select") {
              return field.options && field.options.length > 0
            }
            return true
          })
        },
        { message: "Select type fields must have at least one option" },
      ),
    apiKeyId: z.string().min(1, "API key is required"),
    categoryIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
    thumbnailId: z.string().optional(),
  })

export type ToolFormData = z.infer<typeof toolFormSchema>

export interface ToolFormRef {
  submit: () => void
  getValues: () => ToolFormData
}

const EMPTY_API_KEYS: ApiKeyConfig[] = []

interface DialogState {
  open: boolean
  name: string
  description?: string
}

interface TagDialogState {
  open: boolean
  name: string
}

interface ToolFormDialogsState {
  category: DialogState
  tag: TagDialogState
}

type ToolFormDialogsAction =
  | { type: "OPEN_CATEGORY_DIALOG" }
  | { type: "CLOSE_CATEGORY_DIALOG" }
  | { type: "SET_CATEGORY_NAME"; payload: string }
  | { type: "SET_CATEGORY_DESCRIPTION"; payload: string }
  | { type: "RESET_CATEGORY_FORM" }
  | { type: "OPEN_TAG_DIALOG" }
  | { type: "CLOSE_TAG_DIALOG" }
  | { type: "SET_TAG_NAME"; payload: string }
  | { type: "RESET_TAG_FORM" }

const dialogsInitialState: ToolFormDialogsState = {
  category: { open: false, name: "", description: "" },
  tag: { open: false, name: "" },
}

function dialogsReducer(
  state: ToolFormDialogsState,
  action: ToolFormDialogsAction,
): ToolFormDialogsState {
  switch (action.type) {
    case "OPEN_CATEGORY_DIALOG":
      return { ...state, category: { ...state.category, open: true } }
    case "CLOSE_CATEGORY_DIALOG":
      return { ...state, category: { ...state.category, open: false } }
    case "SET_CATEGORY_NAME":
      return {
        ...state,
        category: { ...state.category, name: action.payload },
      }
    case "SET_CATEGORY_DESCRIPTION":
      return {
        ...state,
        category: { ...state.category, description: action.payload },
      }
    case "RESET_CATEGORY_FORM":
      return { ...state, category: { open: false, name: "", description: "" } }
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

interface UseToolFormOptions {
  mode: "create" | "edit"
  initialData?: SelectTool
  onSubmit: (data: ToolFormData) => void | Promise<void>
  apiKeys?: ApiKeyConfig[]
}

const useToolForm = ({
  mode,
  initialData,
  onSubmit,
  apiKeys,
}: UseToolFormOptions) => {
  const queryClient = useQueryClient()
  const safeApiKeys = apiKeys ?? EMPTY_API_KEYS
  const systemRoleRef = useRef<HTMLTextAreaElement>(null)
  const userInstructionRef = useRef<HTMLTextAreaElement>(null)
  const { data: availableModelsData } = useAvailableModels()
  const { data: categoriesData } = useCategories()
  const { data: tagsData } = useTags()
  const [dialogsState, dialogsDispatch] = useReducer(
    dialogsReducer,
    dialogsInitialState,
  )

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.categories.create.call({
        name: dialogsState.category.name,
        description: dialogsState.category.description ?? undefined,
      })
    },
    onSuccess: (category) => {
      toastManager.add({
        title: "Category created",
        description: `${dialogsState.category.name} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      const currentCategoryIds = form.getFieldValue("categoryIds")
      form.setFieldValue("categoryIds", [...currentCategoryIds, category.id])
      dialogsDispatch({ type: "RESET_CATEGORY_FORM" })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating category",
        description: error.message,
        type: "error",
      })
    },
  })

  const createTagMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.tags.create.call({
        name: dialogsState.tag.name,
      })
    },
    onSuccess: (tag) => {
      toastManager.add({
        title: "Tag created",
        description: `${dialogsState.tag.name} has been created successfully.`,
        type: "success",
      })
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
      const currentTagIds = form.getFieldValue("tagIds")
      form.setFieldValue("tagIds", [...currentTagIds, tag.id])
      dialogsDispatch({ type: "RESET_TAG_FORM" })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating tag",
        description: error.message,
        type: "error",
      })
    },
  })

  const availableModels = useMemo(() => {
    if (!availableModelsData || availableModelsData.length === 0) {
      return []
    }
    return availableModelsData.map((model) => model.id)
  }, [availableModelsData])

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

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      excerpt: "",
      inputFields: [] as {
        id: string
        variableName: string
        type: InputFieldType
        description: string
        options?: SelectOption[]
        isOptional?: boolean
      }[],
      systemRole: "",
      userInstructionTemplate: "",
      modelEngine: "",
      temperature: 0.7,
      maxTokens: 2048,
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
        excerpt: value.excerpt || undefined,
        systemRole: value.systemRole,
        userInstructionTemplate: value.userInstructionTemplate,
        inputVariable: value.inputFields.map((field) => ({
          variableName: field.variableName,
          type: field.type,
          description: field.description,
          ...(field.options && { options: field.options }),
          ...(field.isOptional !== undefined && {
            isOptional: field.isOptional,
          }),
        })),
        outputFormat: value.outputFormat,
        costPerRun: String(value.costPerRun),
        config: {
          modelEngine: value.modelEngine,
          temperature: value.temperature,
          maxTokens: value.maxTokens,
        },
        status: "draft" as const,
        apiKeyId: value.apiKeyId,
        ...(value.categoryIds &&
          value.categoryIds.length > 0 && { categoryIds: value.categoryIds }),
        ...(value.tagIds &&
          value.tagIds.length > 0 && { tagIds: value.tagIds }),
        thumbnailId: value.thumbnailId,
      }

      const result = toolFormSchema.safeParse(formData)

      if (!result.success) {
        const firstError = result.error.issues[0]
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

  const getFormValues = (): ToolFormData => {
    const formData = form.state.values
    return {
      name: formData.name,
      description: formData.description,
      excerpt: formData.excerpt || undefined,
      systemRole: formData.systemRole,
      userInstructionTemplate: formData.userInstructionTemplate,
      inputVariable: formData.inputFields.map((field) => ({
        variableName: field.variableName,
        type: field.type,
        description: field.description,
        ...(field.options && { options: field.options }),
        ...(field.isOptional !== undefined && {
          isOptional: field.isOptional,
        }),
      })),
      outputFormat: formData.outputFormat,
      costPerRun: String(formData.costPerRun),
      config: {
        modelEngine: formData.modelEngine,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
      },
      status: "draft" as const,
      apiKeyId: formData.apiKeyId,
      ...(formData.categoryIds &&
        formData.categoryIds.length > 0 && {
          categoryIds: formData.categoryIds,
        }),
      ...(formData.tagIds &&
        formData.tagIds.length > 0 && { tagIds: formData.tagIds }),
      ...(formData.thumbnailId && { thumbnailId: formData.thumbnailId }),
    }
  }

  const onModelsAvailable = useEffectEvent(() => {
    if (availableModels.length > 0 && !form.getFieldValue("modelEngine")) {
      form.setFieldValue("modelEngine", availableModels[0])
    }
  })

  useEffect(() => {
    onModelsAvailable()
  }, [availableModels])

  const onInitialDataLoaded = useEffectEvent(() => {
    if (mode === "edit" && initialData) {
      form.setFieldValue("name", initialData.name)
      form.setFieldValue("description", initialData.description ?? "")
      form.setFieldValue("excerpt", initialData.excerpt ?? "")
      form.setFieldValue("systemRole", initialData.systemRole ?? "")
      form.setFieldValue(
        "userInstructionTemplate",
        initialData.userInstructionTemplate ?? "",
      )

      if (
        initialData.inputVariable &&
        Array.isArray(initialData.inputVariable)
      ) {
        form.setFieldValue(
          "inputFields",
          (
            initialData.inputVariable as {
              variableName: string
              type: InputFieldType
              description: string
              options?: SelectOption[]
            }[]
          ).map((field, index) => ({
            id: String(index + 1),
            ...field,
          })),
        )
      }

      if (initialData.config && typeof initialData.config === "object") {
        const config = initialData.config as {
          modelEngine?: string
          temperature?: number
          maxTokens?: number
        }
        if (config.modelEngine)
          form.setFieldValue("modelEngine", config.modelEngine)
        if (config.temperature !== undefined)
          form.setFieldValue("temperature", config.temperature)
        if (config.maxTokens !== undefined)
          form.setFieldValue("maxTokens", config.maxTokens)
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
    const modelEngine = form.getFieldValue("modelEngine")

    if (apiKeyId && modelEngine) {
      const selectedKey = safeApiKeys.find((key) => key.id === apiKeyId)
      if (selectedKey) {
        const isValid = validateModelProviderMatch(
          modelEngine,
          selectedKey.provider,
        )
        if (!isValid) {
          const errorMessage = getProviderMismatchMessage(
            modelEngine,
            selectedKey.provider,
          )
          form.setFieldValue("apiKeyError", errorMessage)
        } else {
          form.setFieldValue("apiKeyError", "")
        }
      }
    }
  })

  useEffect(() => {
    onApiKeyOrModelChange()
  }, [form.state.values.apiKeyId, form.state.values.modelEngine, safeApiKeys])

  const handleInsertVariable = (
    variable: string,
    target: "systemRole" | "userInstruction",
  ) => {
    const fieldName =
      target === "systemRole" ? "systemRole" : "userInstructionTemplate"
    const currentValue = form.getFieldValue(fieldName)
    const ref = target === "systemRole" ? systemRoleRef : userInstructionRef

    const textarea = ref.current
    if (textarea && textarea === document.activeElement) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue =
        currentValue.substring(0, start) +
        `{{${variable}}}` +
        currentValue.substring(end)
      form.setFieldValue(fieldName, newValue)

      setTimeout(() => {
        const newPosition = start + variable.length + 4
        textarea.selectionStart = textarea.selectionEnd = newPosition
        textarea.focus()
      }, 0)
    } else {
      form.setFieldValue(fieldName, `${currentValue}\n{{${variable}}}`)
    }
  }

  const handleAddField = () => {
    const newId = String(Date.now())
    const currentFields = form.getFieldValue("inputFields")
    form.setFieldValue("inputFields", [
      ...currentFields,
      {
        id: newId,
        variableName: "",
        type: "text" as const,
        description: "",
      },
    ])
  }

  const handleUpdateField = (
    id: string,
    updates: Partial<{
      variableName: string
      type: InputFieldType
      description: string
      options: SelectOption[]
      isOptional: boolean
    }>,
  ) => {
    const currentFields = form.getFieldValue("inputFields")
    const updatedFields = currentFields.map((field) =>
      field.id === id ? { ...field, ...updates } : field,
    )
    form.setFieldValue("inputFields", updatedFields)
  }

  const handleDeleteField = (id: string) => {
    const currentFields = form.getFieldValue("inputFields")
    const filteredFields = currentFields.filter((field) => field.id !== id)
    form.setFieldValue("inputFields", filteredFields)
  }

  return {
    form,
    getFormValues,
    safeApiKeys,
    systemRoleRef,
    userInstructionRef,
    availableModels,
    categories,
    tags,
    dialogsState,
    dialogsDispatch,
    createCategoryMutation,
    createTagMutation,
    handleInsertVariable,
    handleAddField,
    handleUpdateField,
    handleDeleteField,
  }
}

export default useToolForm
