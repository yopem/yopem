"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { memo } from "react"
import * as v from "valibot"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Card, CardPanel, CardHeader } from "ui/card"
import { FieldError } from "ui/field"
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

import { providerNames } from "@/lib/utils/provider"

const providerOptions = Object.entries(providerNames).map(([value, label]) => ({
  value,
  label,
}))

const providerValidator = v.picklist(["openai", "openrouter", "fal"])

const modelIdValidator = v.pipe(
  v.string(),
  v.minLength(1, "Model ID is required"),
  v.trim(),
)

const displayNameValidator = v.pipe(
  v.string(),
  v.minLength(1, "Display name is required"),
  v.trim(),
)

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

  const form = useForm({
    defaultValues: {
      provider: "openai" as ApiKeyProvider,
      modelId: "",
      displayName: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await addMutation.mutateAsync({
          provider: value.provider,
          modelId: value.modelId.trim(),
          displayName: value.displayName.trim(),
          isEnabled: true,
        })
        form.reset()
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
    },
  })

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
              <form.Field
                name="provider"
                validators={{ onChange: providerValidator }}
              >
                {(field) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        field.handleChange(value)
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select provider">
                        {
                          providerOptions.find(
                            (opt) => opt.value === field.state.value,
                          )?.label
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
                )}
              </form.Field>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Model ID</Label>
              <form.Field
                name="modelId"
                validators={{
                  onMount: modelIdValidator,
                  onChange: modelIdValidator,
                  onSubmit: modelIdValidator,
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-1">
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. kimi-k3"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>
                        {field.state.meta.errors[0]?.message}
                      </FieldError>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1">
              <Label className="text-xs">Display Name</Label>
              <form.Field
                name="displayName"
                validators={{
                  onMount: displayNameValidator,
                  onChange: displayNameValidator,
                  onSubmit: displayNameValidator,
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-1">
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Kimi K3"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>
                        {field.state.meta.errors[0]?.message}
                      </FieldError>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
            <div className="flex items-end">
              <form.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <Button
                    onClick={() => void form.handleSubmit()}
                    disabled={!canSubmit || addMutation.isPending}
                  >
                    <PlusIcon className="size-4" />
                    Add
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </div>
      </CardPanel>
    </Card>
  )
})
