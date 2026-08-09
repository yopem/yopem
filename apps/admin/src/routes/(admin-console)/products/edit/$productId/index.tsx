import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"

import { getInputFieldsFromWorkflow } from "db/schema/product-workflow-utils"
import { queryApi } from "rpc/query"
import { Spinner } from "ui/spinner"
import { toastManager } from "ui/toast"

import type { ProductInputVariable } from "@/features/products/product-input-field"

import { FeatureBuilderHeader } from "@/features/products/feature-builder-header"
import {
  ProductForm,
  type ProductFormData,
  type ProductFormRef,
} from "@/features/products/product-form"
import { ProductPreviewSheet } from "@/features/products/product-preview-sheet"

export const Route = createFileRoute(
  "/(admin-console)/products/edit/$productId/",
)({
  component: ProductEditRouteComponent,
})

function ProductEditRouteComponent() {
  const { productId } = Route.useParams()

  const { data: apiKeys } = useQuery(queryApi.admin.apiKeyList.queryOptions())

  const formRef = useRef<ProductFormRef>(null)
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false)
  const [previewResult, setPreviewResult] = useState<string | null>(null)
  const [previewSteps, setPreviewSteps] = useState<
    { nodeId: string; outputName: string; value: string; status: string }[]
  >([])
  const [currentFormData, setCurrentFormData] =
    useState<ProductFormData | null>(null)

  const {
    data: product,
    isLoading,
    error,
  } = useQuery(
    queryApi.products.adminById.queryOptions({
      input: { id: productId },
    }),
  )

  const updateProductMutation = useMutation(
    queryApi.products.update.mutationOptions({
      onSuccess: (_, variables) => {
        toastManager.add({
          title: "Product updated successfully!",
          description: `${variables.name} has been updated.`,
          type: "success",
        })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error updating product",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const executePreviewMutation = useMutation(
    queryApi.products.preview.mutationOptions({
      onSuccess: (data) => {
        setPreviewResult(data.output)
        setPreviewSteps(
          (data.steps ?? []).map((s) => ({
            nodeId: s.nodeId,
            outputName: s.outputName,
            value: s.value,
            status: s.status,
          })),
        )
        toastManager.add({
          title: "Preview completed",
          description:
            "Preview execution completed successfully (no credits used)",
          type: "success",
        })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Preview execution failed",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const handlePreviewRun = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (!formData) {
      toastManager.add({
        title: "Cannot preview",
        description: "Please fill out the form first",
        type: "error",
      })
      return
    }

    const inputFields = getInputFieldsFromWorkflow(formData.workflow)
    if (inputFields.length === 0) {
      toastManager.add({
        title: "Cannot preview",
        description: "Workflow must contain at least one input field",
        type: "error",
      })
      return
    }

    if (!formData.apiKeyId) {
      toastManager.add({
        title: "Cannot preview",
        description:
          "Please select an API key for this product before previewing",
        type: "error",
      })
      return
    }

    const productConfig = formData.config as { modelEngine?: string } | null
    if (!productConfig?.modelEngine) {
      toastManager.add({
        title: "Cannot preview",
        description:
          "Please select a model engine for this product before previewing",
        type: "error",
      })
      return
    }

    setCurrentFormData(formData)
    setPreviewResult(null)
    setPreviewSteps([])
    setPreviewSheetOpen(true)
  }, [])

  const currentInputVariables: ProductInputVariable[] = currentFormData
    ? getInputFieldsFromWorkflow(currentFormData.workflow).map((v) => ({
        variableName: v.variableName,
        description: v.description,
        type: v.type,
        ...(v.options && { options: v.options }),
      }))
    : []

  const handleExecutePreview = useCallback(
    (inputs: Record<string, string>) => {
      if (!currentFormData) return

      executePreviewMutation.mutate({
        workflow: currentFormData.workflow,
        config: currentFormData.config as { modelEngine: string },
        outputFormat: currentFormData.outputFormat ?? "plain",
        inputs,
        apiKeyId: currentFormData.apiKeyId,
      })
    },
    [executePreviewMutation, currentFormData],
  )

  const handleSaveDraft = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateProductMutation.mutate({
        id: productId,
        ...formData,
        status: "draft",
      })
    }
  }, [updateProductMutation, productId])

  const handlePublish = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateProductMutation.mutate({
        id: productId,
        ...formData,
        status: "active",
      })
    }
  }, [updateProductMutation, productId])

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/products" },
          { label: product?.name ?? "Edit Product" },
        ]}
        mode="edit"
        status={product?.status ?? "draft"}
        onPreviewRun={handlePreviewRun}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={updateProductMutation.isPending}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="flex h-96 items-center justify-center p-8">
          <Spinner className="text-muted-foreground size-8" />
        </div>
      ) : error ? (
        <div className="text-destructive p-8">
          Error loading product: {error.message}
        </div>
      ) : (
        <>
          {product && (
            <ProductForm
              ref={formRef}
              mode="edit"
              initialData={product}
              onSubmit={(data) =>
                updateProductMutation.mutate({ id: productId, ...data })
              }
              isSaving={updateProductMutation.isPending}
              showSlug={true}
              apiKeys={apiKeys ?? []}
            />
          )}
        </>
      )}

      <ProductPreviewSheet
        open={previewSheetOpen}
        onOpenChange={setPreviewSheetOpen}
        inputVariables={currentInputVariables}
        onExecute={handleExecutePreview}
        isExecuting={executePreviewMutation.isPending}
        result={previewResult}
        steps={previewSteps}
      />
    </>
  )
}
