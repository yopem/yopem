"use client"

import { useImperativeHandle, type Ref } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { SelectTool } from "@/lib/db/schema"
import type { ApiKeyConfig } from "@/lib/schemas/api-keys"

import ConfigurationPanel from "./configuration-panel"
import InputVariableSection from "./input-variable-section"
import PromptLogicSection from "./prompt-logic-section"
import ToolFormCategoryDialog from "./tool-form-category-dialog"
import ToolFormTagDialog from "./tool-form-tag-dialog"
import useToolForm, {
  type ToolFormData,
  type ToolFormRef,
} from "./use-tool-form"

export type { ToolFormData, ToolFormRef }

interface ToolFormProps {
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
  apiKeys,
  ref,
}: ToolFormProps) => {
  const {
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
  } = useToolForm({ mode, initialData, onSubmit, apiKeys })

  useImperativeHandle(ref, () => ({
    submit: () => {
      void form.handleSubmit()
    },
    getValues: getFormValues,
  }))

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

          <form.Field name="excerpt">
            {(field) => (
              <Field>
                <FieldLabel>Excerpt (optional)</FieldLabel>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Short summary for tool cards (max 500 chars)"
                  rows={2}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  A short summary that appears on tool cards. If empty, the
                  description will be used.
                </p>
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
          categoryIds: state.values.categoryIds,
          tagIds: state.values.tagIds,
          thumbnailId: state.values.thumbnailId,
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
          categoryIds,
          tagIds,
          thumbnailId,
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
              categoryIds,
              tagIds,
              categories,
              tags,
              thumbnailId,
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
              onCategoriesChange: (value) =>
                form.setFieldValue("categoryIds", value),
              onTagsChange: (value) => form.setFieldValue("tagIds", value),
              onAddNewCategory: () =>
                dialogsDispatch({ type: "OPEN_CATEGORY_DIALOG" }),
              onAddNewTag: () => dialogsDispatch({ type: "OPEN_TAG_DIALOG" }),
              onThumbnailIdChange: (value) =>
                form.setFieldValue("thumbnailId", value),
            }}
          />
        )}
      </form.Subscribe>

      <ToolFormCategoryDialog
        open={dialogsState.category.open}
        name={dialogsState.category.name}
        description={dialogsState.category.description}
        createMutation={createCategoryMutation}
        onOpenChange={(open) =>
          open
            ? dialogsDispatch({ type: "OPEN_CATEGORY_DIALOG" })
            : dialogsDispatch({ type: "CLOSE_CATEGORY_DIALOG" })
        }
        onNameChange={(value) =>
          dialogsDispatch({ type: "SET_CATEGORY_NAME", payload: value })
        }
        onDescriptionChange={(value) =>
          dialogsDispatch({
            type: "SET_CATEGORY_DESCRIPTION",
            payload: value,
          })
        }
        onCancel={() => dialogsDispatch({ type: "CLOSE_CATEGORY_DIALOG" })}
      />

      <ToolFormTagDialog
        open={dialogsState.tag.open}
        name={dialogsState.tag.name}
        createMutation={createTagMutation}
        onOpenChange={(open) =>
          open
            ? dialogsDispatch({ type: "OPEN_TAG_DIALOG" })
            : dialogsDispatch({ type: "CLOSE_TAG_DIALOG" })
        }
        onNameChange={(value) =>
          dialogsDispatch({ type: "SET_TAG_NAME", payload: value })
        }
        onCancel={() => dialogsDispatch({ type: "CLOSE_TAG_DIALOG" })}
      />
    </div>
  )
}

export default ToolForm
