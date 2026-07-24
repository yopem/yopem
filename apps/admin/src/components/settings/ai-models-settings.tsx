"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { memo, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Card, CardContent, CardHeader } from "ui/card"
import { Input } from "ui/input"
import { Label } from "ui/label"
import { Switch } from "ui/switch"
import { toastManager } from "ui/toast"

const modelOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "fal", label: "fal.ai" },
]

const AIModelsSettings = memo(() => {
  const queryClient = useQueryClient()

  const { data: models, isLoading } = useQuery({
    ...queryApi.admin.getAIModels.queryOptions(),
  })

  const deleteMutation = useMutation({
    ...queryApi.admin.deleteAIModel.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getAIModels.queryKey(),
      })
    },
  })

  const addMutation = useMutation({
    ...queryApi.admin.addAIModel.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getAIModels.queryKey(),
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string
      isEnabled?: boolean
      displayName?: string
    }) => {
      await queryApi.admin.updateAIModel.call(input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getAIModels.queryKey(),
      })
    },
  })

  const [newProvider, setNewProvider] = useState("openai")
  const [newModelId, setNewModelId] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")

  const handleAdd = async () => {
    if (!newModelId.trim() || !newDisplayName.trim()) return
    try {
      await addMutation.mutateAsync({
        provider: newProvider,
        modelId: newModelId.trim(),
        displayName: newDisplayName.trim(),
      })
      setNewModelId("")
      setNewDisplayName("")
      toastManager.add({
        title: "AI model added",
        type: "success",
      })
    } catch (e) {
      toastManager.add({
        title: "Failed to add AI model",
        description: e instanceof Error ? e.message : "Unknown error",
        type: "error",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="bg-card/50 flex-row items-center justify-between border-b p-6">
        <div className="flex items-center gap-4">
          <div className="bg-foreground flex size-10 items-center justify-center rounded-md [&>svg]:size-6">
            <SparklesIcon className="text-background" />
          </div>
          <div>
            <h3 className="text-foreground font-medium">AI Models</h3>
            <p className="text-muted-foreground text-xs">
              Configure which models are available in product forms. Models are
              filtered by the selected API key&apos;s provider.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-6">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : models && models.length > 0 ? (
          <div className="divide-border flex flex-col divide-y">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    checked={model.isEnabled}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({
                        id: model.id,
                        isEnabled: checked,
                      })
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">
                      {model.displayName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {model.provider} / {model.modelId}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={async () => {
                    try {
                      await deleteMutation.mutateAsync({ id: model.id })
                      toastManager.add({
                        title: "AI model deleted",
                        type: "success",
                      })
                    } catch (e) {
                      toastManager.add({
                        title: "Failed to delete AI model",
                        description:
                          e instanceof Error ? e.message : "Unknown error",
                        type: "error",
                      })
                    }
                  }}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No AI models configured. Add models below to make them available in
            product forms.
          </p>
        )}

        <div className="bg-border h-px w-full" />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Add New Model</Label>
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-32 flex-1 flex-col gap-1">
              <Label className="text-xs">Provider</Label>
              <select
                className="border-border bg-background text-foreground h-9 rounded-md border px-3 text-sm"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
              >
                {modelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Model ID</Label>
              <Input
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="e.g. gpt-4o-mini"
              />
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. GPT-4o Mini"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAdd}
                disabled={
                  !newModelId.trim() ||
                  !newDisplayName.trim() ||
                  addMutation.isPending
                }
              >
                <PlusIcon className="size-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

AIModelsSettings.displayName = "AIModelsSettings"

export default AIModelsSettings
