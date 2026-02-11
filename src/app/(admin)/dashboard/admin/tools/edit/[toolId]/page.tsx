"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, {
  type ToolFormData,
  type ToolFormRef,
} from "@/components/admin/tools/tool-form"
import ToolPreviewSheet from "@/components/admin/tools/tool-preview-sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toastManager } from "@/components/ui/toast"
import { useApiKeys } from "@/hooks/use-api-keys"
import { queryApi } from "@/lib/orpc/query"

function EditToolPage() {
  const params = useParams()
  const toolId = params["toolId"] as string
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

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tools", toolId],
    queryFn: async () => {
      return await queryApi.tools.getById.call({ id: toolId })
    },
  })

  const updateToolMutation = useMutation({
    mutationFn: async (data: ToolFormData) => {
      await queryApi.tools.update.call({
        id: toolId,
        ...data,
      })
    },
    onSuccess: (_, variables) => {
      toastManager.add({
        title: "Tool updated successfully!",
        description: `${variables.name} has been updated.`,
        type: "success",
      })
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error updating tool",
        description: err.message,
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
    onError: (err: Error) => {
      toastManager.add({
        title: "Preview execution failed",
        description: err.message,
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
      updateToolMutation.mutate({ ...formData, status: "draft" })
    }
  }, [updateToolMutation])

  const handlePublish = useCallback(() => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateToolMutation.mutate({ ...formData, status: "active" })
    }
  }, [updateToolMutation])

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: tool?.name ?? "Edit Tool" },
        ]}
        mode="edit"
        status={tool?.status ?? "draft"}
        onPreviewRun={handlePreviewRun}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={updateToolMutation.isPending}
      />

      {isLoading ? (
        <Shimmer>
          <div className="p-8">
            <Skeleton className="h-96 w-full" />
          </div>
        </Shimmer>
      ) : error ? (
        <div className="text-destructive p-8">
          Error loading tool: {error.message}
        </div>
      ) : (
        <>
          {tool && (
            <ToolForm
              ref={formRef}
              mode="edit"
              initialData={tool}
              onSubmit={(data) => updateToolMutation.mutate(data)}
              isSaving={updateToolMutation.isPending}
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

export default EditToolPage
