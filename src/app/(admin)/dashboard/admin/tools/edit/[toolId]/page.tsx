"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { LoaderCircleIcon } from "lucide-react"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, { type ToolFormData } from "@/components/admin/tools/tool-form"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

function EditToolPage() {
  const params = useParams()
  const toolId = params["toolId"] as string
  const [activeTab, setActiveTab] = useState("builder")
  const [testSheetOpen, setTestSheetOpen] = useState(false)
  const [testInputs, setTestInputs] = useState<Record<string, string>>({})
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
    if (!tool?.inputSchema || !Array.isArray(tool.inputSchema)) return
    const initialInputs: Record<string, string> = {}
    tool.inputSchema.forEach((field: { variableName: string }) => {
      initialInputs[field.variableName] = ""
    })
    setTestInputs(initialInputs)
    setTestResult(null)
    setTestSheetOpen(true)
  }

  const handleExecuteTest = () => {
    executeToolMutation.mutate(testInputs)
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

      <Sheet open={testSheetOpen} onOpenChange={setTestSheetOpen}>
        <SheetPopup side="right">
          <SheetPanel>
            <SheetHeader>
              <SheetTitle>Test Tool Execution</SheetTitle>
              <SheetDescription>
                Test your tool with sample inputs before deploying.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-6">
              <>
                {tool?.inputSchema &&
                  Array.isArray(tool.inputSchema) &&
                  tool.inputSchema.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {(
                        tool.inputSchema as {
                          variableName: string
                          description: string
                          type: string
                        }[]
                      ).map((field) => (
                        <Field key={field.variableName}>
                          <FieldLabel>{field.variableName}</FieldLabel>
                          <Input
                            value={testInputs[field.variableName] || ""}
                            onChange={(e) =>
                              setTestInputs((prev) => ({
                                ...prev,
                                [field.variableName]: e.target.value,
                              }))
                            }
                            placeholder={field.description}
                          />
                        </Field>
                      ))}
                    </div>
                  )}
              </>

              <Button
                onClick={handleExecuteTest}
                disabled={executeToolMutation.isPending}
              >
                {executeToolMutation.isPending ? (
                  <>
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  "Execute Test"
                )}
              </Button>

              {testResult && (
                <div className="bg-muted mt-4 rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Result:</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </>
  )
}

export default EditToolPage
