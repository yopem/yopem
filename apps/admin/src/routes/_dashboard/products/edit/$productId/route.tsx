import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { queryApi } from "rpc/query"
import { Separator } from "ui/separator"
import { toastManager } from "ui/toast"

import FeatureBuilderHeader from "@/components/products/feature-builder-header"
import FeatureBuilderTabs from "@/components/products/feature-builder-tabs"
import ProductForm, {
  type ProductFormData,
  type ProductFormRef,
} from "@/components/products/product-form"
import ProductPreviewSheet from "@/components/products/product-preview-sheet"

const EditProductPage = () => {
  const { productId } = Route.useParams()

  const { data: apiKeys } = useQuery({
    ...queryApi.admin.getApiKeys.queryOptions(),
  })

  const formRef = useRef<ProductFormRef>(null)
  const [activeTab, setActiveTab] = useState("builder")
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
  } = useQuery({
    queryKey: ["products", productId],
    queryFn: async () => {
      return await queryApi.products.adminGetById.call({ id: productId })
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await queryApi.products.update.call({
        id: productId,
        ...data,
      })
    },
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
  })

  const executePreviewMutation = useMutation({
    mutationFn: async ({
      formData,
      inputs,
    }: {
      formData: ProductFormData
      inputs: Record<string, string>
    }) => {
      return await queryApi.products.executePreview.call({
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
  })

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

      executePreviewMutation.mutate({ formData, inputs })
    },
    [executePreviewMutation],
  )

  const handleSaveDraft = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateProductMutation.mutate({ ...formData, status: "draft" })
    }
  }, [updateProductMutation])

  const handlePublish = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateProductMutation.mutate({ ...formData, status: "active" })
    }
  }, [updateProductMutation])

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
                onSubmit={(data) => updateProductMutation.mutate(data)}
                isSaving={updateProductMutation.isPending}
                showSlug={true}
                apiKeys={apiKeys ?? []}
              />
            )}
            <div className="p-8">
              <FeatureBuilderTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              <Separator className="mt-8" />
            </div>
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

export const Route = createFileRoute("/_dashboard/products/edit/$productId")({
  component: EditProductPage,
})
