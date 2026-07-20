import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { Button } from "ui/button"
import { Separator } from "ui/separator"
import { toastManager } from "ui/toast"
import type { AddApiKeyInput, ApiKeyConfig } from "utils/api-keys-schema"

import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import AddProviderDialog from "@/components/settings/add-provider-dialog"
import AiModelsSettings from "@/components/settings/ai-models-settings"
import AssetUploadSettings from "@/components/settings/asset-upload-settings"
import DeleteProviderDialog from "@/components/settings/delete-provider-dialog"
import EditProviderDialog from "@/components/settings/edit-provider-dialog"
import ProviderCard from "@/components/settings/provider-card"

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Settings" }]

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A"
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const defaultFormData: AddApiKeyInput = {
  provider: "openai",
  name: "",
  description: "",
  apiKey: "",
  status: "active",
  skipValidation: false,
}

const SettingsPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<AddApiKeyInput>(defaultFormData)
  const [editingProvider, setEditingProvider] = useState<ApiKeyConfig | null>(
    null,
  )
  const [deletingProvider, setDeletingProvider] = useState<ApiKeyConfig | null>(
    null,
  )
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    ...queryApi.admin.getApiKeys.queryOptions(),
  })

  const { data: apiKeyStats } = useQuery({
    ...queryApi.admin.getApiKeyStats.queryOptions(),
  })

  const { data: assetSettings, isLoading: assetLoading } = useQuery({
    ...queryApi.admin.getAssetSettings.queryOptions(),
  })

  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState(
    assetSettings?.maxUploadSizeMB ?? 50,
  )

  useEffect(() => {
    if (assetSettings) {
      setMaxUploadSizeMB(assetSettings.maxUploadSizeMB)
    }
  }, [assetSettings])

  const addKeyMutation = useMutation({
    mutationFn: (data: AddApiKeyInput) => queryApi.admin.addApiKey.call(data),
    onSuccess: () => {
      toastManager.add({ title: "Provider added", type: "success" })
      setAddDialogOpen(false)
      setFormData(defaultFormData)
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
    onError: (e: Error) => {
      toastManager.add({
        title: "Failed to add provider",
        description: e.message,
        type: "error",
      })
    },
  })

  const updateKeyMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof queryApi.admin.updateApiKey.call>[0],
    ) => queryApi.admin.updateApiKey.call(data),
    onSuccess: () => {
      toastManager.add({ title: "Provider updated", type: "success" })
      setEditDialogOpen(false)
      setEditingProvider(null)
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
    },
    onError: (e: Error) => {
      toastManager.add({
        title: "Failed to update provider",
        description: e.message,
        type: "error",
      })
    },
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (data: { id: string }) =>
      queryApi.admin.deleteApiKey.call(data),
    onSuccess: () => {
      toastManager.add({ title: "Provider deleted", type: "success" })
      setDeleteDialogOpen(false)
      setDeletingProvider(null)
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
    onError: (e: Error) => {
      toastManager.add({
        title: "Failed to delete provider",
        description: e.message,
        type: "error",
      })
    },
  })

  const toggleKeyVisibility = useCallback((keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(keyId)) next.delete(keyId)
      else next.add(keyId)
      return next
    })
  }, [])

  const handleEditProvider = useCallback((provider: ApiKeyConfig) => {
    setEditingProvider(provider)
    setEditDialogOpen(true)
  }, [])

  const handleDeleteProvider = useCallback((provider: ApiKeyConfig) => {
    setDeletingProvider(provider)
    setDeleteDialogOpen(true)
  }, [])

  const saveAssetMutation = useMutation({
    mutationFn: (data: { maxUploadSizeMB: number }) =>
      queryApi.admin.updateAssetSettings.call(data),
    onSuccess: () => {
      toastManager.add({ title: "Asset settings saved", type: "success" })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getAssetSettings.queryKey(),
      })
    },
    onError: (e: Error) => {
      toastManager.add({
        title: "Failed to save asset settings",
        description: e.message,
        type: "error",
      })
    },
  })

  return (
    <HydrateClient state={dehydratedState}>
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <AdminBreadcrumb items={breadcrumbItems} />

        <AdminPageHeader
          title="Settings"
          description="Manage API keys, AI models, and system settings"
        />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">API Keys</h2>
              <p className="text-muted-foreground text-sm">
                {apiKeyStats?.activeKeys != null
                  ? `${apiKeyStats.activeKeys} active keys · ${apiKeyStats.totalRequests.toLocaleString()} total requests`
                  : "Manage your AI provider API keys"}
              </p>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>Add Provider</Button>
          </div>

          <Shimmer loading={apiKeysLoading}>
            <div className="space-y-4">
              {apiKeys?.map((key) => (
                <ProviderCard
                  key={key.id}
                  apiKey={key}
                  isVisible={visibleKeys.has(key.id)}
                  onToggleVisibility={toggleKeyVisibility}
                  onEdit={handleEditProvider}
                  onDelete={handleDeleteProvider}
                  formatDateTime={formatDateTime}
                />
              ))}
              {apiKeys && apiKeys.length === 0 && (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No API keys configured. Add one to get started.
                </p>
              )}
            </div>
          </Shimmer>
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-semibold">AI Models</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Configure AI models available for each provider
          </p>
          <AiModelsSettings />
        </section>

        <Separator />

        <AssetUploadSettings
          maxUploadSize={maxUploadSizeMB}
          isLoading={assetLoading || saveAssetMutation.isPending}
          onMaxUploadSizeChange={setMaxUploadSizeMB}
          onSave={() => saveAssetMutation.mutate({ maxUploadSizeMB })}
        />
      </div>

      <AddProviderDialog
        open={addDialogOpen}
        formData={formData}
        isPending={addKeyMutation.isPending}
        onOpenChange={setAddDialogOpen}
        onFormDataChange={setFormData}
        onSubmit={() => addKeyMutation.mutate(formData)}
        onCancel={() => {
          setAddDialogOpen(false)
          setFormData(defaultFormData)
        }}
      />

      {editingProvider && (
        <EditProviderDialog
          open={editDialogOpen}
          provider={editingProvider}
          isPending={updateKeyMutation.isPending}
          onOpenChange={setEditDialogOpen}
          onProviderChange={setEditingProvider}
          onSubmit={() => {
            const p = editingProvider
            updateKeyMutation.mutate({
              id: p.id,
              name: p.name,
              description: p.description,
              status: p.status === "active" ? "active" : "inactive",
            })
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setEditingProvider(null)
          }}
        />
      )}

      {deletingProvider && (
        <DeleteProviderDialog
          open={deleteDialogOpen}
          provider={deletingProvider}
          isPending={deleteKeyMutation.isPending}
          onOpenChange={setDeleteDialogOpen}
          onSubmit={() => deleteKeyMutation.mutate({ id: deletingProvider.id })}
          onCancel={() => {
            setDeleteDialogOpen(false)
            setDeletingProvider(null)
          }}
        />
      )}
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/setting")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.admin.getApiKeys.queryOptions(),
      serverQueryApi.admin.getApiKeyStats.queryOptions(),
      serverQueryApi.admin.getAIModels.queryOptions(),
      serverQueryApi.admin.getAssetSettings.queryOptions(),
    ])
    return { dehydratedState }
  },
  component: SettingsPage,
})
