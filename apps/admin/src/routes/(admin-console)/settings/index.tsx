import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Separator } from "ui/separator"
import { Spinner } from "ui/spinner"
import { toastManager } from "ui/toast"
import type { ApiKeyConfig } from "utils/api-input"
import { formatDateTime } from "utils/format-date"

import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"
import { AddProviderDialog } from "@/features/settings/add-provider-dialog"
import { AIModelsSettings } from "@/features/settings/ai-model-settings"
import { AssetUploadSettings } from "@/features/settings/asset-upload-settings"
import { DeleteProviderDialog } from "@/features/settings/delete-provider-dialog"
import { EditProviderDialog } from "@/features/settings/edit-provider-dialog"
import { ProviderCard } from "@/features/settings/provider-card"

export const Route = createFileRoute("/(admin-console)/settings/")({
  component: SettingsRouteComponent,
})

function SettingsRouteComponent() {
  const queryClient = useQueryClient()

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

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Settings" }]

  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery(
    queryApi.admin.apiKeyList.queryOptions(),
  )

  const { data: apiKeyStats } = useQuery(
    queryApi.admin.apiKeyStats.queryOptions(),
  )

  const { data: assetSettings, isLoading: assetLoading } = useQuery(
    queryApi.admin.assetSettingsGet.queryOptions(),
  )

  const defaultMaxUploadSize = assetSettings?.maxUploadSizeMB ?? 50

  const addKeyMutation = useMutation(
    queryApi.admin.apiKeyCreate.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Provider added", type: "success" })
        setAddDialogOpen(false)
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyList.queryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyStats.queryKey(),
        })
      },
      onError: (e: Error) => {
        toastManager.add({
          title: "Failed to add provider",
          description: e.message,
          type: "error",
        })
      },
    }),
  )

  const updateKeyMutation = useMutation(
    queryApi.admin.apiKeyUpdate.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Provider updated", type: "success" })
        setEditDialogOpen(false)
        setEditingProvider(null)
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyList.queryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyStats.queryKey(),
        })
      },
      onError: (e: Error) => {
        toastManager.add({
          title: "Failed to update provider",
          description: e.message,
          type: "error",
        })
      },
    }),
  )

  const deleteKeyMutation = useMutation(
    queryApi.admin.apiKeyDelete.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Provider deleted", type: "success" })
        setDeleteDialogOpen(false)
        setDeletingProvider(null)
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyList.queryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.apiKeyStats.queryKey(),
        })
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.modelList.queryKey(),
        })
      },
      onError: (e: Error) => {
        toastManager.add({
          title: "Failed to delete provider",
          description: e.message,
          type: "error",
        })
      },
    }),
  )

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

  const saveAssetMutation = useMutation(
    queryApi.admin.assetSettingsUpdate.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Asset settings saved", type: "success" })
        void queryClient.invalidateQueries({
          queryKey: queryApi.admin.assetSettingsGet.queryKey(),
        })
      },
      onError: (e: Error) => {
        toastManager.add({
          title: "Failed to save asset settings",
          description: e.message,
          type: "error",
        })
      },
    }),
  )

  return (
    <>
      <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
        <GlobalBreadcrumb items={breadcrumbItems} />
        <GlobalPageHeader
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

          {apiKeysLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="text-muted-foreground size-8" />
            </div>
          ) : (
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
          )}
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-semibold">AI Models</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Configure AI models available for each provider
          </p>
          <AIModelsSettings />
        </section>

        <Separator />

        <AssetUploadSettings
          defaultMaxUploadSize={defaultMaxUploadSize}
          isLoading={assetLoading || saveAssetMutation.isPending}
          onSave={(size) => saveAssetMutation.mutate({ maxUploadSizeMB: size })}
        />
      </div>

      <AddProviderDialog
        open={addDialogOpen}
        isPending={addKeyMutation.isPending}
        onOpenChange={setAddDialogOpen}
        onSubmit={(values) => addKeyMutation.mutate(values)}
        onCancel={() => setAddDialogOpen(false)}
      />

      {editingProvider && (
        <EditProviderDialog
          open={editDialogOpen}
          provider={editingProvider}
          isPending={updateKeyMutation.isPending}
          onOpenChange={setEditDialogOpen}
          onSubmit={(values) => updateKeyMutation.mutate(values)}
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
    </>
  )
}
