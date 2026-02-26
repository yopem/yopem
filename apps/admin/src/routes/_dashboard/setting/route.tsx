import { createFileRoute } from "@tanstack/react-router"
import type { AddApiKeyInput, ApiKeyConfig } from "@repo/shared/api-keys-schema"

import { formatError, logger } from "@repo/logger"
import { queryApi } from "@repo/orpc/query"
import { formatDateTime } from "@repo/shared/format-date"
import { toastManager } from "@repo/ui/toast"
import {
  BarChartIcon,
  DollarSignIcon,
  KeyIcon,
  PlusCircleIcon,
} from "lucide-react"
import { useCallback, useEffect, useReducer, useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import StatsCard from "@/components/dashboard/stats-card"
import AdminBreadcrumb from "@/components/layout/admin-breadcrumb"
import AdminPageHeader from "@/components/layout/admin-page-header"
import AddProviderDialog from "@/components/settings/add-provider-dialog"
import AssetUploadSettings from "@/components/settings/asset-upload-settings"
import DeleteProviderDialog from "@/components/settings/delete-provider-dialog"
import EditProviderDialog from "@/components/settings/edit-provider-dialog"
import ProviderCard from "@/components/settings/provider-card"
import ProviderCardSkeleton from "@/components/settings/provider-card-skeleton"
import {
  useAddApiKey,
  useApiKeys,
  useApiKeyStats,
  useDeleteApiKey,
  useUpdateApiKey,
} from "@/hooks/use-api-keys"

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

interface AssetSettingsState {
  maxUploadSize: number
  isLoading: boolean
}

type AssetSettingsAction =
  | { type: "SET_MAX_UPLOAD_SIZE"; value: number }
  | { type: "SET_LOADED"; maxUploadSizeMB: number }
  | { type: "SET_LOADING_DONE" }

function assetSettingsReducer(
  state: AssetSettingsState,
  action: AssetSettingsAction,
): AssetSettingsState {
  switch (action.type) {
    case "SET_MAX_UPLOAD_SIZE":
      return { ...state, maxUploadSize: action.value }
    case "SET_LOADED":
      return { maxUploadSize: action.maxUploadSizeMB, isLoading: false }
    case "SET_LOADING_DONE":
      return { ...state, isLoading: false }
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
  const [assetSettings, assetSettingsDispatch] = useReducer(
    assetSettingsReducer,
    { maxUploadSize: 50, isLoading: true },
  )

  const { data: apiKeys, isLoading: keysLoading } = useApiKeys()
  const { data: stats, isLoading: statsLoading } = useApiKeyStats()
  const addMutation = useAddApiKey()
  const updateMutation = useUpdateApiKey()
  const deleteMutation = useDeleteApiKey()

  useEffect(() => {
    let cancelled = false
    const fetchAssetSettings = async () => {
      try {
        const result = await queryApi.admin.getAssetSettings.call()
        if (!cancelled) {
          assetSettingsDispatch({
            type: "SET_LOADED",
            maxUploadSizeMB: result.maxUploadSizeMB,
          })
        }
      } catch (error) {
        if (!cancelled) {
          logger.error(`Failed to fetch asset settings: ${formatError(error)}`)
        }
      }
      if (!cancelled) {
        assetSettingsDispatch({ type: "SET_LOADING_DONE" })
      }
    }
    void fetchAssetSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const updateAssetSettings = useCallback(async () => {
    try {
      await queryApi.admin.updateAssetSettings.call({
        maxUploadSizeMB: assetSettings.maxUploadSize,
      })
      toastManager.add({
        title: "Asset settings updated",
        type: "success",
      })
    } catch (error) {
      logger.error(`Failed to update asset settings: ${formatError(error)}`)
      toastManager.add({
        title: "Failed to update asset settings",
        type: "error",
      })
    }
  }, [assetSettings.maxUploadSize])

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
        logger.error(`Error adding provider: ${formatError(error)}`)
      }
    })()
  }, [addMutation, providerForm.formData])

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
        toastManager.add({ title: "Failed to update provider", type: "error" })
        logger.error(`Error updating provider: ${formatError(error)}`)
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
        toastManager.add({ title: "Failed to delete provider", type: "error" })
        logger.error(`Error deleting provider: ${formatError(error)}`)
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
                          prevMonthRequests === 0 && stats.requestsThisMonth > 0
                            ? 100
                            : prevMonthRequests === 0
                              ? 0
                              : ((stats.requestsThisMonth - prevMonthRequests) /
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
                  stats?.costChange !== undefined && stats.costChange !== "N/A"
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
              maxUploadSize={assetSettings.maxUploadSize}
              isLoading={assetSettings.isLoading}
              onMaxUploadSizeChange={(value) =>
                assetSettingsDispatch({ type: "SET_MAX_UPLOAD_SIZE", value })
              }
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
  )
}

export const Route = createFileRoute("/_dashboard/setting")({
  component: AdminSettingsPage,
})
