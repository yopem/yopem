"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"

import FeatureBuilderHeader from "@/components/admin/tools/feature-builder-header"
import FeatureBuilderTabs from "@/components/admin/tools/feature-builder-tabs"
import ToolForm, { type ToolFormData } from "@/components/admin/tools/tool-form"
import { Separator } from "@/components/ui/separator"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

function AddToolPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("builder")
  const [handleFormSubmit, setHandleFormSubmit] = useState<() => void>()

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
      router.push(`/dashboard/admin/tools/edit/${data.id}`)
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error creating tool",
        description: err.message,
        type: "error",
      })
    },
  })

  const handleTestRun = () => {
    console.info("Test Run clicked")
  }

  const handleSave = () => {
    handleFormSubmit?.()
  }

  return (
    <>
      <FeatureBuilderHeader
        breadcrumbItems={[
          { label: "Features", href: "/dashboard/admin/tools" },
          { label: "New Tool" },
        ]}
        status="Draft"
        onTestRun={handleTestRun}
        onSave={handleSave}
        isSaving={createToolMutation.isPending}
      />
      {activeTab === "builder" && (
        <ToolForm
          mode="create"
          onSubmit={(data) => createToolMutation.mutate(data)}
          isSaving={createToolMutation.isPending}
          showSlug={false}
          onFormReady={setHandleFormSubmit}
        />
      )}
      <div className="p-8">
        <FeatureBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Separator className="mt-8" />
      </div>
    </>
  )
}

export default AddToolPage
