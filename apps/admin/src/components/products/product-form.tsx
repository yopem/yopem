"use client"

import { useImperativeHandle, useState, type Ref } from "react"

import type { SelectProduct } from "db/schema"
import { slateToPlainText } from "editor/serialize"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Textarea } from "ui/textarea"
import type { ApiKeyConfig } from "utils/api-input"

import { ConfigurationPanel } from "./configuration-panel"
import { DescriptionEditor } from "./description-editor"
import { InputVariableSection } from "./input-variable-section"
import { ProductBuilderTips } from "./product-builder-tips"
import { ProductFormCategoryDialog } from "./product-form-category-dialog"
import { ProductFormTabs, type ProductFormStep } from "./product-form-tabs"
import { ProductFormTagDialog } from "./product-form-tag-dialog"
import { PromptLogicSection } from "./prompt-logic-section"
import {
  useProductForm,
  type ProductFormData,
  type ProductFormRef,
} from "./use-product-form"

export type { ProductFormData, ProductFormRef }

interface ProductFormProps {
  mode: "create" | "edit"
  initialData?: SelectProduct
  onSubmit: (data: ProductFormData) => void | Promise<void>
  isSaving?: boolean
  showSlug?: boolean
  apiKeys?: ApiKeyConfig[]
  ref?: Ref<ProductFormRef>
}

export function ProductForm({
  mode,
  initialData,
  onSubmit,
  showSlug = true,
  apiKeys,
  ref,
}: ProductFormProps) {
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
  } = useProductForm({ mode, initialData, onSubmit, apiKeys })

  const [activeStep, setActiveStep] = useState<ProductFormStep>("basics")

  useImperativeHandle(ref, () => ({
    submit: () => {
      void form.handleSubmit()
    },
    getValues: getFormValues,
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border border-b px-8">
        <ProductFormTabs activeStep={activeStep} onStepChange={setActiveStep} />
      </div>

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        <ProductBuilderTips mode={mode} step={activeStep} />

        {activeStep === "basics" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">Basics</h3>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Name your product, add a short excerpt, and write the public
                description users will see.
              </p>
            </div>

            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>Product Name</FieldLabel>
                  <Input
                    nativeInput={mode === "create"}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter product name"
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

            <form.Field name="excerpt">
              {(field) => (
                <Field>
                  <FieldLabel>Excerpt (optional)</FieldLabel>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Short summary for product cards (max 500 chars)"
                    rows={2}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    A short summary that appears on product cards. Auto-filled
                    from the description if left empty.
                  </p>
                </Field>
              )}
            </form.Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <DescriptionEditor
                initialValue={form.getFieldValue("descriptionContent")}
                onChange={(value, html) => {
                  form.setFieldValue("descriptionContent", value)
                  form.setFieldValue("description", html)
                }}
                onBlur={() => {
                  const currentExcerpt = form.getFieldValue("excerpt")
                  if (!currentExcerpt || currentExcerpt.trim() === "") {
                    const currentContent =
                      form.getFieldValue("descriptionContent")
                    const plain = slateToPlainText(currentContent)
                    const trimmed = plain.slice(0, 150)
                    const snippet =
                      plain.length > 150
                        ? trimmed.slice(0, trimmed.lastIndexOf(" ")) + "…"
                        : trimmed
                    if (snippet) {
                      form.setFieldValue("excerpt", snippet)
                    }
                  }
                }}
              />
            </Field>
          </div>
        )}

        {activeStep === "inputs" && (
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
        )}

        {activeStep === "prompt" && (
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
                systemRoleRef={systemRoleRef}
                userInstructionRef={userInstructionRef}
              />
            )}
          </form.Subscribe>
        )}

        {activeStep === "configure" && (
          <form.Subscribe
            selector={(state) => ({
              modelEngine: state.values.modelEngine,
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
                  onOutputFormatChange: (value) =>
                    form.setFieldValue("outputFormat", value),
                  onCostPerRunChange: (value) =>
                    form.setFieldValue("costPerRun", value),
                  onMarkupChange: (value) =>
                    form.setFieldValue("markup", value),
                  onApiKeyIdChange: (value) => {
                    form.setFieldValue("apiKeyId", value)
                    form.setFieldValue("apiKeyError", "")
                  },
                  onCategoriesChange: (value) =>
                    form.setFieldValue("categoryIds", value),
                  onTagsChange: (value) => form.setFieldValue("tagIds", value),
                  onAddNewCategory: () =>
                    dialogsDispatch({ type: "OPEN_CATEGORY_DIALOG" }),
                  onAddNewTag: () =>
                    dialogsDispatch({ type: "OPEN_TAG_DIALOG" }),
                  onThumbnailIdChange: (value) =>
                    form.setFieldValue("thumbnailId", value),
                }}
              />
            )}
          </form.Subscribe>
        )}
      </div>

      <ProductFormCategoryDialog
        open={dialogsState.category.open}
        name={dialogsState.category.name}
        description={dialogsState.category.description}
        parentId={dialogsState.category.parentId}
        categories={categories}
        createMutation={createCategoryMutation}
        onOpenChange={(open) =>
          open
            ? dialogsDispatch({ type: "OPEN_CATEGORY_DIALOG" })
            : dialogsDispatch({ type: "CLOSE_CATEGORY_DIALOG" })
        }
        onNameChange={(value) =>
          dialogsDispatch({
            type: "SET_CATEGORY_NAME",
            payload: value,
          })
        }
        onDescriptionChange={(value) =>
          dialogsDispatch({
            type: "SET_CATEGORY_DESCRIPTION",
            payload: value,
          })
        }
        onParentIdChange={(value) =>
          dialogsDispatch({
            type: "SET_CATEGORY_PARENT_ID",
            payload: value ?? "",
          })
        }
        onCancel={() => dialogsDispatch({ type: "CLOSE_CATEGORY_DIALOG" })}
      />

      <ProductFormTagDialog
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
