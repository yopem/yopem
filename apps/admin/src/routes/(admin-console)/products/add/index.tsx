import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"

import { queryApi } from "rpc/query"
import { toastManager } from "ui/toast"

import { FeatureBuilderHeader } from "@/components/products/feature-builder-header"
import {
  ProductForm,
  type ProductFormRef,
} from "@/components/products/product-form"
import { ProductPreviewSheet } from "@/components/products/product-preview-sheet"

export const Route = createFileRoute("/(admin-console)/products/add/")({
  component: ProductAddRouteComponent,
})

function ProductAddRouteComponent() {
  const navigate = useNavigate()

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

  const createProductMutation = useMutation(
    queryApi.products.create.mutationOptions({
      onSuccess: (data, variables) => {
        if (!data) return
        toastManager.add({
          title: "Product created successfully!",
          description: `${variables.name} has been created.`,
          type: "success",
        })
        void navigate({
          to: "/products/edit/$productId",
          params: { productId: data.id },
        })
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Error creating product",
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
      createProductMutation.mutate({ ...formData, status: "draft" })
    }
  }, [createProductMutation])

  const handlePublish = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      createProductMutation.mutate({ ...formData, status: "active" })
    }
  }, [createProductMutation])

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/products" },
          { label: "New Product" },
        ]}
        status="draft"
        onPreviewRun={handlePreviewRun}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={createProductMutation.isPending}
      />
      <ProductForm
        ref={formRef}
        mode="create"
        onSubmit={(data) => createProductMutation.mutate(data)}
        isSaving={createProductMutation.isPending}
        showSlug={false}
        apiKeys={apiKeys ?? []}
      />

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
