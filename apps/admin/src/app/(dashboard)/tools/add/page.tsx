"use client"

import { queryApi } from "@repo/api/orpc/query"
import { Separator } from "@repo/ui/separator"
import { toastManager } from "@repo/ui/toast"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, {
  type ToolFormData,
  type ToolFormRef,
} from "@/components/admin/tools/tool-form"
import ToolPreviewSheet from "@/components/admin/tools/tool-preview-sheet"
import { useApiKeys } from "@/hooks/use-api-keys"

function AddToolPage() {
  const router = useRouter()
  const { data: apiKeys } = useApiKeys()
  const formRef = useRef<ToolFormRef>(null)
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

  const createToolMutation = useMutation({
    mutationFn: async (data: ToolFormData) => {
      const result = await queryApi.tools.create.call(data)
      return result
    },
    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Tool created successfully!",
        description: `${variables.name} has been created.`,
        type: "success",
      })
      router.push(`/tools/edit/${data.id}`)
    },
    onError: (error: Error) => {
      toastManager.add({
        title: "Error creating tool",
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
      formData: ToolFormData
      inputs: Record<string, string>
    }) => {
      return await queryApi.tools.executePreview.call({
        systemRole: formData.systemRole,
        userInstructionTemplate: formData.userInstructionTemplate,
        inputVariable: formData.inputVariable,
        config: formData.config as {
          modelEngine: string
          temperature: number
          maxTokens: number
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
      createToolMutation.mutate({ ...formData, status: "draft" })
    }
  }, [createToolMutation])

  const handlePublish = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      createToolMutation.mutate({ ...formData, status: "active" })
    }
  }, [createToolMutation])

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/tools" },
          { label: "New Tool" },
        ]}
        status="draft"
        onPreviewRun={handlePreviewRun}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={createToolMutation.isPending}
      />
      <ToolForm
        ref={formRef}
        mode="create"
        onSubmit={(data) => createToolMutation.mutate(data)}
        isSaving={createToolMutation.isPending}
        showSlug={false}
        apiKeys={apiKeys ?? []}
      />
      <div className="p-8">
        <FeatureBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Separator className="mt-8" />
      </div>

      <ToolPreviewSheet
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

export default AddToolPage
