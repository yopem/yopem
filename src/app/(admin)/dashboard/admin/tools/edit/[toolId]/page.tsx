"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, { type ToolFormData } from "@/components/admin/tools/tool-form"
import ToolTestSheet from "@/components/admin/tools/tool-test-sheet"
import { Separator } from "@/components/ui/separator"
import { toastManager } from "@/components/ui/toast"
import { useApiKeys } from "@/hooks/use-api-keys"
import { queryApi } from "@/lib/orpc/query"

function EditToolPage() {
  const params = useParams()
  const toolId = params["toolId"] as string
  const { data: apiKeys } = useApiKeys()
  const [activeTab, setActiveTab] = useState("builder")
  const [testSheetOpen, setTestSheetOpen] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [handleFormSubmit, setHandleFormSubmit] = useState<() => void>()

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

  const executeToolMutation = useMutation({
    mutationFn: async (inputs: Record<string, unknown>) => {
      return await queryApi.tools.execute.call({
        toolId,
        inputs,
      })
    },
    onSuccess: (data) => {
      setTestResult(data.output)
      toastManager.add({
        title: "Test completed",
        description: `Tool executed successfully. Cost: ${data.cost} credits`,
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
    if (!tool?.inputVariable || !Array.isArray(tool.inputVariable)) return
    setTestResult(null)
    setTestSheetOpen(true)
  }

  const handleExecuteTest = (inputs: Record<string, string>) => {
    executeToolMutation.mutate(inputs)
  }

  const handleSave = () => {
    handleFormSubmit?.()
  }

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: tool?.name ?? "Edit Tool" },
        ]}
        status="Draft"
        onTestRun={handleTestRun}
        onSave={handleSave}
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
          {activeTab === "builder" && tool && (
            <ToolForm
              mode="edit"
              initialData={tool}
              onSubmit={(data) => updateToolMutation.mutate(data)}
              isSaving={updateToolMutation.isPending}
              showSlug={true}
              onFormReady={setHandleFormSubmit}
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
        inputVariables={
          (tool?.inputVariable as
            | {
                variableName: string
                description: string
                type: string
              }[]
            | undefined) ?? []
        }
        onExecute={handleExecuteTest}
        isExecuting={executeToolMutation.isPending}
        result={testResult}
      />
    </>
  )
}

export default EditToolPage
