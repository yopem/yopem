import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { Separator } from "ui/separator"
import { toastManager } from "ui/toast"

import FeatureBuilderHeader from "@/components/products/feature-builder-header"
import FeatureBuilderTabs from "@/components/products/feature-builder-tabs"
import ProductForm, {
  type ProductFormData,
  type ProductFormRef,
} from "@/components/products/product-form"
import ProductPreviewSheet from "@/components/products/product-preview-sheet"

const AddProductPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const navigate = useNavigate()

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

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const result = await queryApi.products.create.call(data)
      return result
    },
    onSuccess: (data, variables) => {
      if (!data) return
      toastManager.add({
        title: "Product created successfully!",
        description: `${variables.name} has been created.`,
        type: "success",
      })
      void navigate({ to: `/products/edit/${data.id}` })
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating product",
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
    <HydrateClient state={dehydratedState}>
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
      <div className="p-8">
        <FeatureBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Separator className="mt-8" />
      </div>

      <ProductPreviewSheet
        open={previewSheetOpen}
        onOpenChange={setPreviewSheetOpen}
        inputVariables={currentInputVariables}
        onExecute={handleExecutePreview}
        isExecuting={executePreviewMutation.isPending}
        result={previewResult}
      />
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/products/add")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.admin.getApiKeys.queryOptions(),
    ])
    return { dehydratedState }
  },
  component: AddProductPage,
})
