"use client"

import { useImperativeHandle, useState, type Ref } from "react"

import type { SelectProduct } from "db/schema"
import { slateToPlainText } from "editor/serialize"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Textarea } from "ui/textarea"
import type { ApiKeyConfig } from "utils/api-input"

import { CategorySelector } from "@/components/categories-tags/category-selector"

import { ConfigurationPanel } from "./configuration-panel"
import { DescriptionEditor } from "./description-editor"
import { ProductBuilderTips } from "./product-builder-tips"
import { ProductFormCategoryDialog } from "./product-form-category-dialog"
import { ProductFormTabs, type ProductFormStep } from "./product-form-tabs"
import { ProductFormTagDialog } from "./product-form-tag-dialog"
import { TagSelector } from "./tag-selector"
import { ThumbnailSelector } from "./thumbnail-selector"
import {
  useProductForm,
  type ProductFormData,
  type ProductFormRef,
} from "./use-product-form"
import { WorkflowEditor } from "./workflow-editor"

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
    availableModels,
    categories,
    tags,
    dialogsState,
    dialogsDispatch,
    createCategoryMutation,
    createTagMutation,
    handleWorkflowChange,
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

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
              <div className="flex flex-col gap-6">
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
                        A short summary that appears on product cards.
                        Auto-filled from the description if left empty.
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

              <form.Subscribe
                selector={(state) => ({
                  categoryIds: state.values.categoryIds,
                  tagIds: state.values.tagIds,
                  thumbnailId: state.values.thumbnailId,
                })}
              >
                {({ categoryIds, tagIds, thumbnailId }) => (
                  <aside className="flex flex-col gap-6 lg:sticky lg:top-0">
                    <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
                      <div className="border-border border-b p-4">
                        <span className="text-sm font-semibold">
                          Organization
                        </span>
                      </div>
                      <div className="flex flex-col gap-6 p-6">
                        <CategorySelector
                          categories={categories}
                          selectedIds={categoryIds}
                          onChange={(value) =>
                            form.setFieldValue("categoryIds", value)
                          }
                          onAddNew={() =>
                            dialogsDispatch({ type: "OPEN_CATEGORY_DIALOG" })
                          }
                        />
                        <TagSelector
                          tags={tags}
                          selectedIds={tagIds}
                          onChange={(value) =>
                            form.setFieldValue("tagIds", value)
                          }
                          onAddNew={() =>
                            dialogsDispatch({ type: "OPEN_TAG_DIALOG" })
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-card text-card-foreground relative flex flex-col rounded-2xl border shadow-xs/5">
                      <div className="border-border border-b p-4">
                        <span className="text-sm font-semibold">Thumbnail</span>
                      </div>
                      <div className="p-6">
                        <ThumbnailSelector
                          value={thumbnailId}
                          onChange={(value) =>
                            form.setFieldValue("thumbnailId", value)
                          }
                        />
                      </div>
                    </div>
                  </aside>
                )}
              </form.Subscribe>
            </div>
          </div>
        )}

        {activeStep === "workflow" && (
          <form.Subscribe
            selector={(state) => ({
              workflow: state.values.workflow,
              apiKeyId: state.values.apiKeyId,
            })}
          >
            {({ workflow, apiKeyId }) => (
              <WorkflowEditor
                workflow={workflow}
                apiKeys={safeApiKeys}
                availableModels={availableModels}
                defaultApiKeyId={apiKeyId}
                onChange={handleWorkflowChange}
              />
            )}
          </form.Subscribe>
        )}

        {activeStep === "configure" && (
          <form.Subscribe
            selector={(state) => ({
              outputFormat: state.values.outputFormat,
              costPerRun: state.values.costPerRun,
              markup: state.values.markup,
              apiKeyId: state.values.apiKeyId,
              apiKeyError: state.values.apiKeyError,
            })}
          >
            {({ outputFormat, costPerRun, markup, apiKeyId, apiKeyError }) => (
              <ConfigurationPanel
                config={{
                  outputFormat,
                  costPerRun,
                  markup,
                  apiKeyId,
                  apiKeyError,
                  availableApiKeys: safeApiKeys,
                }}
                handlers={{
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
