"use client"

import { useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { insertToolSchema, type SelectTool } from "@/lib/db/schema"
import ConfigurationPanel from "./configuration-panel"
import type { InputFieldType } from "./input-schema-row"
import InputSchemaSection from "./input-schema-section"
import PromptLogicSection from "./prompt-logic-section"

const modelOptions = [
  "GPT-4 Turbo",
  "GPT-3.5 Turbo",
  "Claude 3 Opus",
  "Mistral Large",
]

const toolFormSchema = insertToolSchema
  .pick({
    name: true,
    description: true,
    systemRole: true,
    userInstructionTemplate: true,
    inputSchema: true,
    outputFormat: true,
    costPerRun: true,
    config: true,
    status: true,
  })
  .extend({
    name: z.string().min(1, "Tool name is required").trim(),
    description: z.string().min(1, "Tool description is required").trim(),
    systemRole: z.string().min(1, "System role is required").trim(),
    userInstructionTemplate: z
      .string()
      .min(1, "User instruction template is required")
      .trim(),
    inputSchema: z
      .array(
        z.object({
          variableName: z.string().min(1),
          type: z.enum(["text", "select"]),
          description: z.string(),
        }),
      )
      .min(1, "At least one input field is required"),
  })

export type ToolFormData = z.infer<typeof toolFormSchema>

interface ToolFormProps {
  mode: "create" | "edit"
  initialData?: SelectTool
  onSubmit: (data: ToolFormData) => void | Promise<void>
  isSaving?: boolean
  showSlug?: boolean
  onFormReady?: (handleSubmit: () => void) => void
}

const ToolForm = ({
  mode,
  initialData,
  onSubmit,
  showSlug = true,
  onFormReady,
}: ToolFormProps) => {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      inputFields: [] as {
        id: string
        variableName: string
        type: "text" | "select"
        description: string
      }[],
      systemRole: "",
      userInstructionTemplate: "",
      modelEngine: modelOptions[0],
      temperature: 0.7,
      maxTokens: 2048,
      outputFormat: "plain" as "plain" | "json",
      costPerRun: mode === "create" ? 0 : 0.05,
    },
    onSubmit: ({ value }) => {
      const formData = {
        name: value.name,
        description: value.description,
        systemRole: value.systemRole,
        userInstructionTemplate: value.userInstructionTemplate,
        inputSchema: value.inputFields.map((field) => ({
          variableName: field.variableName,
          type: field.type,
          description: field.description,
        })),
        outputFormat: value.outputFormat,
        costPerRun: String(value.costPerRun),
        config: {
          modelEngine: value.modelEngine,
          temperature: value.temperature,
          maxTokens: value.maxTokens,
        },
        status: "draft" as const,
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

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      form.setFieldValue("name", initialData.name)
      form.setFieldValue("description", initialData.description ?? "")
      form.setFieldValue("systemRole", initialData.systemRole ?? "")
      form.setFieldValue(
        "userInstructionTemplate",
        initialData.userInstructionTemplate ?? "",
      )

      if (initialData.inputSchema && Array.isArray(initialData.inputSchema)) {
        form.setFieldValue(
          "inputFields",
          (
            initialData.inputSchema as {
              variableName: string
              type: "text" | "select"
              description: string
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, mode])

  const handleInsertVariable = (variable: string) => {
    form.setFieldValue(
      "userInstructionTemplate",
      `${form.getFieldValue("userInstructionTemplate")}\n{{${variable}}}`,
    )
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
    }>,
  ) => {
    const currentFields = form.getFieldValue("inputFields")
    const updatedFields = currentFields.map((field) =>
      field.id === id
        ? {
            ...field,
            ...updates,
            // Ensure type is compatible with the form's expected type
            type:
              updates.type && ["text", "select"].includes(updates.type)
                ? (updates.type as "text" | "select")
                : field.type,
          }
        : field,
    )
    form.setFieldValue("inputFields", updatedFields)
  }

  const handleDeleteField = (id: string) => {
    const currentFields = form.getFieldValue("inputFields")
    const filteredFields = currentFields.filter((field) => field.id !== id)
    form.setFieldValue("inputFields", filteredFields)
  }

  useEffect(() => {
    if (onFormReady) {
      onFormReady(() => {
        void form.handleSubmit()
      })
    }
  }, [onFormReady, form])

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

        <InputSchemaSection
          fields={form.getFieldValue("inputFields")}
          onAddField={handleAddField}
          onUpdateField={handleUpdateField}
          onDeleteField={handleDeleteField}
        />

        <Separator />

        <PromptLogicSection
          systemRole={form.getFieldValue("systemRole")}
          userInstructionTemplate={form.getFieldValue(
            "userInstructionTemplate",
          )}
          variableNames={form
            .getFieldValue("inputFields")
            .filter((f) => f.variableName && f.variableName.trim() !== "")
            .map((f) => f.variableName)}
          onSystemRoleChange={(value) =>
            form.setFieldValue("systemRole", value)
          }
          onUserInstructionChange={(value) =>
            form.setFieldValue("userInstructionTemplate", value)
          }
          onInsertVariable={handleInsertVariable}
          onRestoreVersion={() => {
            console.info("Restore version clicked")
          }}
        />
      </div>

      <aside className="bg-muted/30 w-80 border-l p-6">
        <ConfigurationPanel
          modelEngine={form.getFieldValue("modelEngine")}
          temperature={form.getFieldValue("temperature")}
          maxTokens={form.getFieldValue("maxTokens")}
          outputFormat={form.getFieldValue("outputFormat")}
          costPerRun={form.getFieldValue("costPerRun")}
          markup={0.2}
          onModelEngineChange={(value) =>
            form.setFieldValue("modelEngine", value)
          }
          onTemperatureChange={(value) =>
            form.setFieldValue("temperature", value)
          }
          onMaxTokensChange={(value) => form.setFieldValue("maxTokens", value)}
          onOutputFormatChange={(value) =>
            form.setFieldValue("outputFormat", value)
          }
          onCostPerRunChange={(value) =>
            form.setFieldValue("costPerRun", value)
          }
          modelOptions={modelOptions}
        />
      </aside>
    </div>
  )
}

export default ToolForm
export { type ToolFormProps }
