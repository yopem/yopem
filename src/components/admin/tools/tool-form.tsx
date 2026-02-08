"use client"

import { useForm } from "@tanstack/react-form"
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from "react"
import { z } from "zod"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { useAvailableModels } from "@/hooks/use-available-models"
import { insertToolSchema, type SelectTool } from "@/lib/db/schema"
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

const ToolForm = ({
  mode,
  initialData,
  onSubmit,
  showSlug = true,
  apiKeys = [],
  ref,
}: ToolFormProps) => {
  const systemRoleRef = useRef<HTMLTextAreaElement>(null)
  const userInstructionRef = useRef<HTMLTextAreaElement>(null)
  const { data: availableModelsData } = useAvailableModels()

  const availableModels = useMemo(() => {
    if (!availableModelsData || availableModelsData.length === 0) {
      return []
    }
    return availableModelsData.map((model) => model.id)
  }, [availableModelsData])

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
    }
  })

  useEffect(() => {
    onInitialDataLoaded()
  }, [initialData, mode])

  const onApiKeyOrModelChange = useEffectEvent(() => {
    const apiKeyId = form.getFieldValue("apiKeyId")
    const modelEngine = form.getFieldValue("modelEngine")

    if (apiKeyId && modelEngine) {
      const selectedKey = apiKeys.find((key) => key.id === apiKeyId)
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
  }, [form.state.values.apiKeyId, form.state.values.modelEngine, apiKeys])

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
              availableApiKeys: apiKeys,
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
    </div>
  )
}

export default ToolForm
