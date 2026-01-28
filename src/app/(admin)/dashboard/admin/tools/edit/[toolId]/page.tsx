"use client"

import { useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, {
  type ToolFormData,
  type ToolFormRef,
} from "@/components/admin/tools/tool-form"
import ToolTestSheet from "@/components/admin/tools/tool-test-sheet"
import { Separator } from "@/components/ui/separator"
import { toastManager } from "@/components/ui/toast"
import { useApiKeys } from "@/hooks/use-api-keys"
import { queryApi } from "@/lib/orpc/query"

function EditToolPage() {
  const params = useParams()
  const toolId = params["toolId"] as string
  const { data: apiKeys } = useApiKeys()
  const formRef = useRef<ToolFormRef>(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [testSheetOpen, setTestSheetOpen] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
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
      setTestResult(data.output)
      toastManager.add({
        title: "Test completed",
        description:
          "Preview execution completed successfully (no credits used)",
        type: "success",
      })
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Test execution failed",
        description: err.message,
        type: "error",
      })
    },
  })

  const handleTestRun = () => {
    const formData = formRef.current?.getValues()
    if (!formData) {
      toastManager.add({
        title: "Cannot test",
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
        title: "Cannot test",
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

    setTestResult(null)
    setTestSheetOpen(true)
  }

  const handleExecuteTest = (inputs: Record<string, string>) => {
    const formData = formRef.current?.getValues()
    if (!formData) return

    executePreviewMutation.mutate({ formData, inputs })
  }

  const handleSaveDraft = () => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateToolMutation.mutate({ ...formData, status: "draft" })
    }
  }

  const handlePublish = () => {
    const formData = formRef.current?.getValues()
    if (formData) {
      updateToolMutation.mutate({ ...formData, status: "active" })
    }
  }

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: tool?.name ?? "Edit Tool" },
        ]}
        status={tool?.status ?? "draft"}
        onTestRun={handleTestRun}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSaving={updateToolMutation.isPending}
      />

      {isLoading ? (
        <div className="text-muted-foreground p-8">Loading tool data...</div>
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

      <ToolTestSheet
        open={testSheetOpen}
        onOpenChange={setTestSheetOpen}
        inputVariables={currentInputVariables}
        onExecute={handleExecuteTest}
        isExecuting={executePreviewMutation.isPending}
        result={testResult}
      />
    </>
  )
}

export default EditToolPage
