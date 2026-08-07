"use client"

import { useImperativeHandle, useState, type Ref } from "react"

import type { SelectProduct } from "db/schema/products"
import { slateToPlainText } from "editor/serialize"
import { Field, FieldLabel } from "ui/field"
import { Input } from "ui/input"
import { Textarea } from "ui/textarea"
import type { ApiKeyConfig } from "utils/api-input"

import { CategorySelector } from "@/components/categories-tags/category-selector"
import { SlugField } from "@/components/slug-field"

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
    categoryDialogOpen,
    setCategoryDialogOpen,
    tagDialogOpen,
    setTagDialogOpen,
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
      <div className="border-border border-b px-4 sm:px-8">
        <ProductFormTabs activeStep={activeStep} onStepChange={setActiveStep} />
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:gap-8 sm:p-8">
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

                {showSlug && mode === "edit" && initialData && (
                  <form.Field name="slug">
                    {(field) => (
                      <SlugField
                        value={field.state.value}
                        onChange={field.handleChange}
                        entity="product"
                        excludeId={initialData.id}
                      />
                    )}
                  </form.Field>
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
                    <ThumbnailSelector
                      value={thumbnailId}
                      onChange={(value) =>
                        form.setFieldValue("thumbnailId", value)
                      }
                    />
                    <CategorySelector
                      categories={categories}
                      selectedIds={categoryIds}
                      onChange={(value) =>
                        form.setFieldValue("categoryIds", value)
                      }
                      onAddNew={() => setCategoryDialogOpen(true)}
                    />
                    <TagSelector
                      tags={tags}
                      selectedIds={tagIds}
                      onChange={(value) => form.setFieldValue("tagIds", value)}
                      onAddNew={() => setTagDialogOpen(true)}
                    />
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
              creditsPerRun: state.values.creditsPerRun,
              apiKeyId: state.values.apiKeyId,
              apiKeyError: state.values.apiKeyError,
            })}
          >
            {({ outputFormat, creditsPerRun, apiKeyId, apiKeyError }) => (
              <ConfigurationPanel
                config={{
                  outputFormat,
                  creditsPerRun,
                  apiKeyId,
                  apiKeyError,
                  availableApiKeys: safeApiKeys,
                }}
                handlers={{
                  onOutputFormatChange: (value) =>
                    form.setFieldValue("outputFormat", value),
                  onCreditsPerRunChange: (value) =>
                    form.setFieldValue("creditsPerRun", value),
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
        open={categoryDialogOpen}
        categories={categories}
        createMutation={createCategoryMutation}
        onOpenChange={setCategoryDialogOpen}
        onCancel={() => setCategoryDialogOpen(false)}
      />

      <ProductFormTagDialog
        open={tagDialogOpen}
        createMutation={createTagMutation}
        onOpenChange={setTagDialogOpen}
        onCancel={() => setTagDialogOpen(false)}
      />
    </div>
  )
}
