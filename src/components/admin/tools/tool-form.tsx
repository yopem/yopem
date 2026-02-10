"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { useAvailableModels } from "@/hooks/use-available-models"
import { useCategories } from "@/hooks/use-categories"
import { useTags } from "@/hooks/use-tags"
import { insertToolSchema, type SelectTool } from "@/lib/db/schema"
import { queryApi } from "@/lib/orpc/query"
import type { ApiKeyConfig } from "@/lib/schemas/api-keys"
import {
  getProviderMismatchMessage,
  validateModelProviderMatch,
} from "@/lib/utils/model-provider-validation"

import ConfigurationPanel from "./configuration-panel"
import type { InputFieldType, SelectOption } from "./input-variable-row"
import InputVariableSection from "./input-variable-section"
import PromptLogicSection from "./prompt-logic-section"

const toolFormSchema = insertToolSchema
  .pick({
    name: true,
    description: true,
    systemRole: true,
    userInstructionTemplate: true,
    inputVariable: true,
    outputFormat: true,
    costPerRun: true,
    config: true,
    status: true,
    apiKeyId: true,
    categoryId: true,
    tagIds: true,
  })
  .extend({
    name: z.string().min(1, "Tool name is required").trim(),
    description: z.string().min(1, "Tool description is required").trim(),
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
    categoryId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
  })

export type ToolFormData = z.infer<typeof toolFormSchema>

export interface ToolFormRef {
  submit: () => void
  getValues: () => ToolFormData
}

export interface ToolFormProps {
  mode: "create" | "edit"
  initialData?: SelectTool
  onSubmit: (data: ToolFormData) => void | Promise<void>
  isSaving?: boolean
  showSlug?: boolean
  apiKeys?: ApiKeyConfig[]
  ref?: Ref<ToolFormRef>
}

const EMPTY_API_KEYS: ApiKeyConfig[] = []

const ToolForm = ({
  mode,
  initialData,
  onSubmit,
  showSlug = true,
  apiKeys,
  ref,
}: ToolFormProps) => {
  const queryClient = useQueryClient()
  const safeApiKeys = apiKeys ?? EMPTY_API_KEYS
  const systemRoleRef = useRef<HTMLTextAreaElement>(null)
  const userInstructionRef = useRef<HTMLTextAreaElement>(null)
  const { data: availableModelsData } = useAvailableModels()
  const { data: categoriesData } = useCategories()
  const { data: tagsData } = useTags()
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false)
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [newTagName, setNewTagName] = useState("")

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return await queryApi.categories.create.call({
        name: newCategoryName,
        description: newCategoryDescription || undefined,
      })
    },
    onSuccess: (category) => {
      toastManager.add({
        title: "Category created",
        description: `${newCategoryName} has been created successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      form.setFieldValue("categoryId", category.id)
      setNewCategoryName("")
      setNewCategoryDescription("")
      setNewCategoryDialogOpen(false)
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
        name: newTagName,
      })
    },
    onSuccess: (tag) => {
      toastManager.add({
        title: "Tag created",
        description: `${newTagName} has been created successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      const currentTagIds = form.getFieldValue("tagIds")
      form.setFieldValue("tagIds", [...currentTagIds, tag.id])
      setNewTagName("")
      setNewTagDialogOpen(false)
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
    return categoriesData.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }))
  }, [categoriesData])

  const tags = useMemo(() => {
    if (!tagsData || tagsData.length === 0) {
      return []
    }
    return tagsData
  }, [tagsData])

  const filteredTags = useMemo(() => {
    if (!tagSearchQuery) return tags
    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    )
  }, [tags, tagSearchQuery])

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
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
      categoryId: "",
      tagIds: [] as string[],
    },
    onSubmit: ({ value }) => {
      const formData = {
        name: value.name,
        description: value.description,
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
        ...(value.categoryId && { categoryId: value.categoryId }),
        ...(value.tagIds &&
          value.tagIds.length > 0 && { tagIds: value.tagIds }),
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

  useImperativeHandle(ref, () => ({
    submit: () => {
      void form.handleSubmit()
    },
    getValues: () => {
      const formData = form.state.values
      return {
        name: formData.name,
        description: formData.description,
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
        ...(formData.categoryId && { categoryId: formData.categoryId }),
        ...(formData.tagIds &&
          formData.tagIds.length > 0 && { tagIds: formData.tagIds }),
      }
    },
  }))

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

      if (initialData.categoryId) {
        form.setFieldValue("categoryId", initialData.categoryId)
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

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Configure Feature Workflow
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Define the input variables, structure your prompt logic, and
            configure the AI model behavior for this feature.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel>Tool Name</FieldLabel>
                <Input
                  nativeInput={mode === "create"}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter tool name"
                />
              </Field>
            )}
          </form.Field>

          {showSlug && mode === "edit" && initialData?.slug && (
            <Field>
              <FieldLabel>Slug</FieldLabel>
              <Input value={initialData.slug} disabled />
              <p className="text-muted-foreground mt-1 text-xs">
                URL-friendly identifier (auto-generated from name)
              </p>
            </Field>
          )}

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel>Tool Description</FieldLabel>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter tool description"
                  rows={3}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="categoryId">
            {(field) => {
              const allCategories = [
                { value: "", label: "No category" },
                ...categories,
              ]
              const selectedCategory =
                allCategories.find((cat) => cat.value === field.state.value) ??
                null

              return (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel>Category</FieldLabel>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setNewCategoryDialogOpen(true)}
                      className="h-auto p-0 text-xs"
                    >
                      + Add New Category
                    </Button>
                  </div>
                  <Combobox
                    value={selectedCategory}
                    items={allCategories}
                    onValueChange={(newValue) => {
                      if (
                        newValue &&
                        typeof newValue === "object" &&
                        "value" in newValue
                      ) {
                        field.handleChange(newValue.value)
                      } else {
                        field.handleChange("")
                      }
                    }}
                  >
                    <ComboboxInput placeholder="Select a category" />
                    <ComboboxPopup>
                      <ComboboxEmpty>No categories found</ComboboxEmpty>
                      <ComboboxList>
                        {(item: { value: string; label: string }) => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="tagIds">
            {(field) => (
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Tags</FieldLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setNewTagDialogOpen(true)}
                    className="h-auto p-0 text-xs"
                  >
                    + Add New Tag
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Search tags..."
                  />
                  {tagSearchQuery && filteredTags.length > 0 && (
                    <div className="bg-muted max-h-40 overflow-y-auto rounded-md border p-2">
                      <div className="flex flex-wrap gap-1">
                        {filteredTags.map((tag) => {
                          const isSelected = field.state.value.includes(tag.id)
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  field.handleChange([
                                    ...field.state.value,
                                    tag.id,
                                  ])
                                  setTagSearchQuery("")
                                }
                              }}
                              className={`rounded px-2 py-1 text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground cursor-not-allowed opacity-50"
                                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                              disabled={isSelected}
                            >
                              {tag.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {field.state.value.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {field.state.value.map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId)
                        if (!tag) return null
                        return (
                          <Badge key={tagId} variant="secondary">
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => {
                                field.handleChange(
                                  field.state.value.filter((id) => id !== tagId),
                                )
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Field>
            )}
          </form.Field>
        </div>

        <Separator />

        <form.Subscribe
          selector={(state) => ({
            inputFields: state.values.inputFields,
          })}
        >
          {({ inputFields }) => (
            <InputVariableSection
              fields={inputFields}
              onAddField={handleAddField}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
            />
          )}
        </form.Subscribe>

        <Separator />

        <form.Subscribe
          selector={(state) => ({
            systemRole: state.values.systemRole,
            userInstructionTemplate: state.values.userInstructionTemplate,
            inputFields: state.values.inputFields,
          })}
        >
          {({ systemRole, userInstructionTemplate, inputFields }) => (
            <PromptLogicSection
              systemRole={systemRole}
              userInstructionTemplate={userInstructionTemplate}
              variables={inputFields
                .filter((f) => f.variableName && f.variableName.trim() !== "")
                .map((f) => ({
                  name: f.variableName,
                  isOptional: f.isOptional ?? false,
                }))}
              onSystemRoleChange={(value) =>
                form.setFieldValue("systemRole", value)
              }
              onUserInstructionChange={(value) =>
                form.setFieldValue("userInstructionTemplate", value)
              }
              onInsertVariable={(variable) =>
                handleInsertVariable(variable, "userInstruction")
              }
              onInsertSystemRoleVariable={(variable) =>
                handleInsertVariable(variable, "systemRole")
              }
              onRestoreVersion={() => {
                return
              }}
              systemRoleRef={systemRoleRef}
              userInstructionRef={userInstructionRef}
            />
          )}
        </form.Subscribe>
      </div>

      <form.Subscribe
        selector={(state) => ({
          modelEngine: state.values.modelEngine,
          temperature: state.values.temperature,
          maxTokens: state.values.maxTokens,
          outputFormat: state.values.outputFormat,
          costPerRun: state.values.costPerRun,
          markup: state.values.markup,
          apiKeyId: state.values.apiKeyId,
          apiKeyError: state.values.apiKeyError,
        })}
      >
        {({
          modelEngine,
          temperature,
          maxTokens,
          outputFormat,
          costPerRun,
          markup,
          apiKeyId,
          apiKeyError,
        }) => (
          <ConfigurationPanel
            config={{
              modelEngine,
              temperature,
              maxTokens,
              outputFormat,
              costPerRun,
              markup,
              apiKeyId,
              apiKeyError,
              modelOptions: availableModels,
              availableApiKeys: safeApiKeys,
            }}
            handlers={{
              onModelEngineChange: (value) =>
                form.setFieldValue("modelEngine", value),
              onTemperatureChange: (value) =>
                form.setFieldValue("temperature", value),
              onMaxTokensChange: (value) =>
                form.setFieldValue("maxTokens", value),
              onOutputFormatChange: (value) =>
                form.setFieldValue("outputFormat", value),
              onCostPerRunChange: (value) =>
                form.setFieldValue("costPerRun", value),
              onMarkupChange: (value) => form.setFieldValue("markup", value),
              onApiKeyIdChange: (value) => {
                form.setFieldValue("apiKeyId", value)
                form.setFieldValue("apiKeyError", "")
              },
            }}
          />
        )}
      </form.Subscribe>

      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogPopup>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">Create New Category</h2>
              <p className="text-muted-foreground text-sm">
                Add a new category to organize your tools
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createCategoryMutation.mutate()}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>

      <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
        <DialogPopup>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">Create New Tag</h2>
              <p className="text-muted-foreground text-sm">
                Add a new tag to label your tools
              </p>
            </div>

            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewTagDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createTagMutation.mutate()}
                disabled={!newTagName.trim() || createTagMutation.isPending}
              >
                {createTagMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  )
}

export default ToolForm
