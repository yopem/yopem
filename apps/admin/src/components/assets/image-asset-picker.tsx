"use client"

import { useCallback, useEffect, useReducer } from "react"

import type { SelectAsset } from "db/schema/assets"
import { queryApi } from "rpc/query"
import { Dialog, DialogPopup } from "ui/dialog"
import { toastManager } from "ui/toast"

import { UploadTab } from "@/components/products/upload-tab"

import { AssetLibrary } from "./asset-library"

export type ImageAsset = Pick<
  SelectAsset,
  "id" | "url" | "originalName" | "type"
>

interface PickerState {
  selectedAssetId: string | null
  assets: ImageAsset[]
  loading: boolean
  uploading: boolean
  activeTab: "library" | "upload"
}

type PickerAction =
  | { type: "SELECT_ASSET"; payload: string | null }
  | { type: "SET_ASSETS"; payload: ImageAsset[] }
  | { type: "PREPEND_ASSET"; payload: ImageAsset }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_UPLOADING"; payload: boolean }
  | { type: "SET_TAB"; payload: "library" | "upload" }
  | { type: "RESET" }

const initialState: PickerState = {
  selectedAssetId: null,
  assets: [],
  loading: false,
  uploading: false,
  activeTab: "library",
}

function pickerReducer(state: PickerState, action: PickerAction): PickerState {
  switch (action.type) {
    case "SELECT_ASSET":
      return { ...state, selectedAssetId: action.payload }
    case "SET_ASSETS":
      return { ...state, assets: action.payload }
    case "PREPEND_ASSET":
      return { ...state, assets: [action.payload, ...state.assets] }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_UPLOADING":
      return { ...state, uploading: action.payload }
    case "SET_TAB":
      return { ...state, activeTab: action.payload }
    case "RESET":
      return {
        ...state,
        selectedAssetId: null,
        activeTab: "library",
        loading: false,
        uploading: false,
      }
    default:
      return state
  }
}

export interface UseImageAssetPickerOptions {
  open: boolean
  onSelect: (asset: ImageAsset) => void
}

export function useImageAssetPicker({
  open,
  onSelect,
}: UseImageAssetPickerOptions) {
  const [state, dispatch] = useReducer(pickerReducer, initialState)

  const loadAssets = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const result = await queryApi.assets.list.call({
        type: "images",
        limit: 100,
      })
      dispatch({ type: "SET_ASSETS", payload: result.assets })
    } catch (error) {
      console.error("Failed to load assets:", error)
    }

    dispatch({ type: "SET_LOADING", payload: false })
  }, [])

  useEffect(() => {
    if (!open) return

    dispatch({ type: "RESET" })
  }, [open])

  useEffect(() => {
    let cancelled = false

    if (!open || state.activeTab !== "library") return

    const run = async () => {
      await loadAssets()
      if (cancelled) return
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [open, state.activeTab, loadAssets])

  const handleConfirm = useCallback(() => {
    const asset = state.assets.find((a) => a.id === state.selectedAssetId)
    if (asset) {
      onSelect(asset)
    }
  }, [state.assets, state.selectedAssetId, onSelect])

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      dispatch({ type: "SET_UPLOADING", payload: true })

      try {
        const asset = await queryApi.assets.upload.call(file)
        dispatch({ type: "PREPEND_ASSET", payload: asset })
        onSelect(asset)
      } catch (error) {
        console.error("Upload failed:", error)
        const message =
          error instanceof Error ? error.message : "Unknown error occurred"
        toastManager.add({
          title: "Upload failed",
          description: message,
          type: "error",
        })
      }

      dispatch({ type: "SET_UPLOADING", payload: false })
      if (event.target) {
        event.target.value = ""
      }
    },
    [onSelect],
  )

  return {
    state,
    dispatch,
    handleConfirm,
    handleUpload,
  }
}

export interface ImageAssetPickerProps extends UseImageAssetPickerOptions {
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function ImageAssetPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Select Image",
  description = "Choose an image from your library or upload a new one",
}: ImageAssetPickerProps) {
  const { state, dispatch, handleConfirm, handleUpload } = useImageAssetPicker({
    open,
    onSelect: (asset) => {
      onSelect(asset)
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-5xl">
        <div className="flex flex-col gap-4 p-6">
          <div className="shrink-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          <div className="border-border flex shrink-0 gap-2 border-b">
            <button
              type="button"
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                state.activeTab === "library"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
              onClick={() => dispatch({ type: "SET_TAB", payload: "library" })}
            >
              Library
            </button>
            <button
              type="button"
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                state.activeTab === "upload"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
              onClick={() => dispatch({ type: "SET_TAB", payload: "upload" })}
            >
              Upload New
            </button>
          </div>

          {state.activeTab === "library" ? (
            <AssetLibrary
              assets={state.assets}
              selectedAssetId={state.selectedAssetId}
              loading={state.loading}
              onSelect={(id) => dispatch({ type: "SELECT_ASSET", payload: id })}
              onSwitchToUpload={() =>
                dispatch({ type: "SET_TAB", payload: "upload" })
              }
              onConfirm={handleConfirm}
              onCancel={() => onOpenChange(false)}
            />
          ) : (
            <UploadTab
              uploading={state.uploading}
              onUpload={handleUpload}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogPopup>
    </Dialog>
  )
}
