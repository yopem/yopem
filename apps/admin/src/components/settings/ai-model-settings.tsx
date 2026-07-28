"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { memo, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Card, CardPanel, CardHeader } from "ui/card"
import { Input } from "ui/input"
import { Label } from "ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Switch } from "ui/switch"
import { toastManager } from "ui/toast"
import type { ApiKeyProvider } from "utils/api-input"

import { providerNames } from "./provider-card"

const providerOptions = Object.entries(providerNames).map(([value, label]) => ({
  value,
  label,
}))

export const AIModelsSettings = memo(() => {
  const queryClient = useQueryClient()

  const { data: models, isLoading } = useQuery(
    queryApi.admin.modelList.queryOptions(),
  )

  const deleteMutation = useMutation(
    queryApi.admin.modelDelete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.modelList.queryKey(),
        })
      },
    }),
  )

  const addMutation = useMutation(
    queryApi.admin.modelCreate.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.modelList.queryKey(),
        })
      },
    }),
  )

  const updateMutation = useMutation(
    queryApi.admin.modelUpdate.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.modelList.queryKey(),
        })
      },
    }),
  )

  const [newProvider, setNewProvider] = useState("openai")
  const [newModelId, setNewModelId] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")

  const handleAdd = async () => {
    if (!newModelId.trim() || !newDisplayName.trim()) return
    try {
      await addMutation.mutateAsync({
        provider: newProvider as ApiKeyProvider,
        modelId: newModelId.trim(),
        displayName: newDisplayName.trim(),
        isEnabled: true,
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
      <CardPanel className="flex flex-col gap-6 p-6">
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
              <Select
                value={newProvider}
                onValueChange={(value) => {
                  if (typeof value === "string") setNewProvider(value)
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select provider">
                    {
                      providerOptions.find((opt) => opt.value === newProvider)
                        ?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Model ID</Label>
              <Input
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="e.g. kimi-k3"
              />
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. Kimi K3"
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
      </CardPanel>
    </Card>
  )
})
