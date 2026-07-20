import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  BarChartIcon,
  DollarSignIcon,
  KeyIcon,
  PlusCircleIcon,
} from "lucide-react"
import { useCallback, useReducer, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { HydrateClient } from "rpc/hydration"
import { prefetchQueries } from "rpc/prefetch"
import { queryApi } from "rpc/query"
import { serverQueryApi } from "rpc/server-query"
import { toastManager } from "ui/toast"
import type { AddApiKeyInput, ApiKeyConfig } from "utils/api-keys-schema"
import { formatDateTime } from "utils/format-date"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import AddProviderDialog from "@/components/settings/add-provider-dialog"
import AssetUploadSettings from "@/components/settings/asset-upload-settings"
import DeleteProviderDialog from "@/components/settings/delete-provider-dialog"
import EditProviderDialog from "@/components/settings/edit-provider-dialog"
import ProviderCard from "@/components/settings/provider-card"
import ProviderCardSkeleton from "@/components/settings/provider-card-skeleton"

type ModalState =
  | { type: "closed" }
  | { type: "adding" }
  | { type: "editing"; provider: ApiKeyConfig }
  | { type: "deleting"; provider: ApiKeyConfig }

type ModalAction =
  | { type: "OPEN_ADD" }
  | { type: "OPEN_EDIT"; provider: ApiKeyConfig }
  | { type: "OPEN_DELETE"; provider: ApiKeyConfig }
  | { type: "CLOSE" }

function modalReducer(_state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "OPEN_ADD":
      return { type: "adding" }
    case "OPEN_EDIT":
      return { type: "editing", provider: action.provider }
    case "OPEN_DELETE":
      return { type: "deleting", provider: action.provider }
    case "CLOSE":
      return { type: "closed" }
  }
}

interface ProviderFormState {
  formData: AddApiKeyInput
  editingProvider: ApiKeyConfig | null
}

type ProviderFormAction =
  | { type: "SET_FORM_DATA"; formData: AddApiKeyInput }
  | { type: "SET_EDITING_PROVIDER"; provider: ApiKeyConfig | null }
  | { type: "RESET_FORM_DATA" }

const defaultFormData: AddApiKeyInput = {
  provider: "openai",
  name: "",
  description: "",
  apiKey: "",
  status: "active",
}

function providerFormReducer(
  state: ProviderFormState,
  action: ProviderFormAction,
): ProviderFormState {
  switch (action.type) {
    case "SET_FORM_DATA":
      return { ...state, formData: action.formData }
    case "SET_EDITING_PROVIDER":
      return { ...state, editingProvider: action.provider }
    case "RESET_FORM_DATA":
      return { ...state, formData: defaultFormData }
  }
}

const AdminSettingsPage = () => {
  const { dehydratedState } = Route.useLoaderData()
  const breadcrumbItems = [
    { label: "Settings", href: "/setting" },
    { label: "API Configuration" },
  ]

  const [modalState, dispatch] = useReducer(modalReducer, { type: "closed" })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [providerForm, providerFormDispatch] = useReducer(providerFormReducer, {
    formData: defaultFormData,
    editingProvider: null,
  })
  const [maxUploadSize, setMaxUploadSize] = useState(50)

  const queryClient = useQueryClient()

  const { data: apiKeys, isLoading: keysLoading } = useQuery({
    ...queryApi.admin.getApiKeys.queryOptions(),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    ...queryApi.admin.getApiKeyStats.queryOptions(),
  })

  const { data: assetSettings, isLoading: assetSettingsLoading } = useQuery({
    ...queryApi.admin.getAssetSettings.queryOptions(),
  })

  const assetSettingsLoaded = assetSettings?.maxUploadSizeMB ?? null

  const effectiveMaxUploadSize = assetSettingsLoaded ?? maxUploadSize

  const addMutation = useMutation({
    ...queryApi.admin.addApiKey.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })

  const updateMutation = useMutation({
    ...queryApi.admin.updateApiKey.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })

  const deleteMutation = useMutation({
    ...queryApi.admin.deleteApiKey.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeys.queryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getApiKeyStats.queryKey(),
      })
    },
  })

  const updateAssetSettingsMutation = useMutation({
    ...queryApi.admin.updateAssetSettings.mutationOptions(),
    onSuccess: () => {
      toastManager.add({
        title: "Asset settings updated",
        type: "success",
      })
      void queryClient.invalidateQueries({
        queryKey: queryApi.admin.getAssetSettings.queryKey(),
      })
    },
    onError: (error: Error) => {
      console.error("Failed to update asset settings:", error)
      toastManager.add({
        title: "Failed to update asset settings",
        type: "error",
      })
    },
  })

  const updateAssetSettings = useCallback(() => {
    updateAssetSettingsMutation.mutate({
      maxUploadSizeMB: effectiveMaxUploadSize,
    })
  }, [updateAssetSettingsMutation, effectiveMaxUploadSize])

  const handleAddProvider = useCallback(() => {
    void (async () => {
      try {
        await addMutation.mutateAsync(providerForm.formData)
        toastManager.add({
          title: "Provider added successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
        providerFormDispatch({ type: "RESET_FORM_DATA" })
      } catch (error) {
        toastManager.add({ title: "Failed to add provider", type: "error" })
        console.error("Error adding provider:", error)
      }
    })()
  }, [addMutation, providerForm.formData, providerFormDispatch])

  const handleUpdateProvider = useCallback(() => {
    const ep = providerForm.editingProvider
    if (!ep) return
    void (async () => {
      try {
        await updateMutation.mutateAsync({
          id: ep.id,
          name: ep.name,
          description: ep.description,
          status: ep.status,
          provider: ep.provider,
        })
        toastManager.add({
          title: "Provider updated successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
      } catch (error) {
        toastManager.add({
          title: "Failed to update provider",
          type: "error",
        })
        console.error("Error updating provider:", error)
      }
    })()
  }, [updateMutation, providerForm.editingProvider])

  const handleDeleteProvider = useCallback(() => {
    if (modalState.type !== "deleting") return
    void (async () => {
      try {
        await deleteMutation.mutateAsync({ id: modalState.provider.id })
        toastManager.add({
          title: "Provider deleted successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
      } catch (error) {
        toastManager.add({
          title: "Failed to delete provider",
          type: "error",
        })
        console.error("Error deleting provider:", error)
      }
    })()
  }, [deleteMutation, modalState])

  const toggleKeyVisibility = useCallback((keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }, [])

  const openEditModal = useCallback(
    (provider: ApiKeyConfig) => {
      providerFormDispatch({ type: "SET_EDITING_PROVIDER", provider })
      dispatch({ type: "OPEN_EDIT", provider })
    },
    [providerFormDispatch],
  )

  const openDeleteModal = useCallback((provider: ApiKeyConfig) => {
    dispatch({ type: "OPEN_DELETE", provider })
  }, [])

  return (
    <HydrateClient state={dehydratedState}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-24">
            <AdminBreadcrumb items={breadcrumbItems} />

            <AdminPageHeader
              title="API Configuration"
              description="Manage API keys and secrets for your AI providers. Keys are encrypted at rest. Rotate keys periodically for enhanced security."
            />

            <Shimmer loading={statsLoading}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatsCard
                  title="Total Requests"
                  value={(stats?.totalRequests ?? 0).toLocaleString()}
                  change={
                    stats?.requestsThisMonth !== undefined &&
                    stats?.totalRequests !== undefined &&
                    stats.totalRequests > 0
                      ? (() => {
                          const prevMonthRequests =
                            stats.totalRequests - stats.requestsThisMonth
                          const trend =
                            prevMonthRequests === 0 &&
                            stats.requestsThisMonth > 0
                              ? 100
                              : prevMonthRequests === 0
                                ? 0
                                : ((stats.requestsThisMonth -
                                    prevMonthRequests) /
                                    prevMonthRequests) *
                                  100
                          return {
                            value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% from last month`,
                            trend:
                              trend > 0 ? "up" : trend < 0 ? "down" : "neutral",
                          }
                        })()
                      : undefined
                  }
                  icon={<BarChartIcon className="size-4.5" />}
                  loading={statsLoading}
                />
                <StatsCard
                  title="Active Keys"
                  value={stats?.activeKeys?.toString() ?? "0"}
                  icon={<KeyIcon className="size-4.5" />}
                  loading={statsLoading}
                />
                <StatsCard
                  title="Monthly Cost"
                  value={`$${(stats?.monthlyCost ?? 0).toFixed(2)}`}
                  change={
                    stats?.costChange !== undefined &&
                    stats.costChange !== "N/A"
                      ? {
                          value: `${stats.costChange} from last month`,
                          trend: stats.costChange.startsWith("+")
                            ? "up"
                            : stats.costChange.startsWith("-")
                              ? "down"
                              : "neutral",
                        }
                      : undefined
                  }
                  icon={<DollarSignIcon className="size-4.5" />}
                  loading={statsLoading}
                />
              </div>
            </Shimmer>

            <div className="flex flex-col gap-8">
              <Shimmer loading={keysLoading}>
                {keysLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <ProviderCardSkeleton key={i} />
                    ))
                  : apiKeys?.map((key) => (
                      <ProviderCard
                        key={key.id}
                        apiKey={key}
                        isVisible={visibleKeys.has(key.id)}
                        onToggleVisibility={toggleKeyVisibility}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                        formatDateTime={formatDateTime}
                      />
                    ))}
              </Shimmer>

              <button
                onClick={() => dispatch({ type: "OPEN_ADD" })}
                className="group border-border text-muted-foreground hover:border-foreground/30 hover:bg-accent/50 hover:text-foreground flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 transition-all"
              >
                <PlusCircleIcon className="size-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-medium">Add New Provider</span>
              </button>

              <AssetUploadSettings
                maxUploadSize={effectiveMaxUploadSize}
                isLoading={assetSettingsLoading}
                onMaxUploadSizeChange={setMaxUploadSize}
                onSave={updateAssetSettings}
              />
            </div>
          </div>
        </div>

        <AddProviderDialog
          open={modalState.type === "adding"}
          formData={providerForm.formData}
          isPending={addMutation.isPending}
          onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
          onFormDataChange={(formData) =>
            providerFormDispatch({ type: "SET_FORM_DATA", formData })
          }
          onSubmit={handleAddProvider}
          onCancel={() => dispatch({ type: "CLOSE" })}
        />

        <EditProviderDialog
          open={modalState.type === "editing"}
          provider={providerForm.editingProvider}
          isPending={updateMutation.isPending}
          onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
          onProviderChange={(provider) =>
            providerFormDispatch({ type: "SET_EDITING_PROVIDER", provider })
          }
          onSubmit={handleUpdateProvider}
          onCancel={() => dispatch({ type: "CLOSE" })}
        />

        <DeleteProviderDialog
          open={modalState.type === "deleting"}
          provider={modalState.type === "deleting" ? modalState.provider : null}
          isPending={deleteMutation.isPending}
          onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
          onSubmit={handleDeleteProvider}
          onCancel={() => dispatch({ type: "CLOSE" })}
        />
      </div>
    </HydrateClient>
  )
}

export const Route = createFileRoute("/_dashboard/setting")({
  loader: async ({ context }) => {
    const dehydratedState = await prefetchQueries(context.queryClient, [
      serverQueryApi.admin.getApiKeys.queryOptions(),
      serverQueryApi.admin.getApiKeyStats.queryOptions(),
      serverQueryApi.admin.getAssetSettings.queryOptions(),
    ])
    return { dehydratedState }
  },
  component: AdminSettingsPage,
})
