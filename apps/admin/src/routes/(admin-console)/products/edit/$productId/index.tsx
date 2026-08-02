import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { queryApi } from "rpc/query"
import { toastManager } from "ui/toast"

import { FeatureBuilderHeader } from "@/components/products/feature-builder-header"
import {
  ProductForm,
  type ProductFormRef,
} from "@/components/products/product-form"
import { ProductPreviewSheet } from "@/components/products/product-preview-sheet"

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
  const [currentInputVariables, setCurrentInputVariables] = useState<
    {
      variableName: string
      description: string
      type: string
      options?: { label: string; value: string }[]
    }[]
  >([])

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

    if (
      !formData.systemRole ||
      !formData.userInstructionTemplate ||
      formData.inputVariable.length === 0
    ) {
      toastManager.add({
        title: "Cannot preview",
        description:
          "Please complete the form: system role, user instruction template, and at least one input variable are required",
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

    const productConfig = formData.config as {
      modelEngine?: string
    } | null
    if (!productConfig?.modelEngine) {
      toastManager.add({
        title: "Cannot preview",
        description:
          "Please select a model engine for this product before previewing",
        type: "error",
      })
      return
    }

    setCurrentInputVariables(
      formData.inputVariable.map((v) => ({
        variableName: v.variableName,
        description: v.description,
        type: v.type,
        ...(v.options && { options: v.options }),
      })),
    )

    setPreviewResult(null)
    setPreviewSheetOpen(true)
  }, [])

  const handleExecutePreview = useCallback(
    (inputs: Record<string, string>) => {
      const formData = formRef.current?.getValues()
      if (!formData) return

      executePreviewMutation.mutate({
        systemRole: formData.systemRole,
        userInstructionTemplate: formData.userInstructionTemplate,
        inputVariable: formData.inputVariable,
        config: formData.config as {
          modelEngine: string
        },
        outputFormat: formData.outputFormat ?? "plain",
        inputs,
        apiKeyId: formData.apiKeyId,
      })
    },
    [executePreviewMutation],
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

      <Shimmer loading={isLoading}>
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-8">
              <div className="bg-muted h-12 w-1/3 rounded-sm" />
              <div className="bg-muted h-96 w-full rounded-sm" />
            </div>
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
      </Shimmer>

      <ProductPreviewSheet
        open={previewSheetOpen}
        onOpenChange={setPreviewSheetOpen}
        inputVariables={currentInputVariables}
        onExecute={handleExecutePreview}
        isExecuting={executePreviewMutation.isPending}
        result={previewResult}
      />
    </>
  )
}
