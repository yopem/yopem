"use client"

import { formatError, logger } from "@repo/logger"
import { queryApi } from "@repo/orpc/query"
import { Dialog, DialogPopup } from "@repo/ui/dialog"
import { useCallback, useEffect, useReducer } from "react"

import AssetLibrary from "./asset-library"
import ThumbnailDisplay from "./thumbnail-display"
import UploadTab from "./upload-tab"

interface Asset {
  id: string
  url: string
  originalName: string
  type: string
}

interface ThumbnailSelectorProps {
  value?: string
  onChange: (value: string | undefined) => void
}

interface SelectorState {
  dialogOpen: boolean
  selectedAssetId: string | null
  currentThumbnail: Asset | null
  assets: Asset[]
  loading: boolean
  uploading: boolean
  activeTab: "library" | "upload"
}

type SelectorAction =
  | { type: "OPEN_DIALOG" }
  | { type: "CLOSE_DIALOG" }
  | { type: "SET_SELECTED_ASSET"; payload: string | null }
  | { type: "SET_CURRENT_THUMBNAIL"; payload: Asset | null }
  | { type: "SET_ASSETS"; payload: Asset[] }
  | { type: "PREPEND_ASSET"; payload: Asset }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_UPLOADING"; payload: boolean }
  | { type: "SET_TAB"; payload: "library" | "upload" }

const initialState: SelectorState = {
  dialogOpen: false,
  selectedAssetId: null,
  currentThumbnail: null,
  assets: [],
  loading: false,
  uploading: false,
  activeTab: "library",
}

const selectorReducer = (
  state: SelectorState,
  action: SelectorAction,
): SelectorState => {
  switch (action.type) {
    case "OPEN_DIALOG":
      return { ...state, dialogOpen: true }
    case "CLOSE_DIALOG":
      return {
        ...state,
        dialogOpen: false,
        selectedAssetId: null,
        activeTab: "library",
      }
    case "SET_SELECTED_ASSET":
      return { ...state, selectedAssetId: action.payload }
    case "SET_CURRENT_THUMBNAIL":
      return { ...state, currentThumbnail: action.payload }
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
    default:
      return state
  }
}

function ThumbnailSelector({ value, onChange }: ThumbnailSelectorProps) {
  const [state, dispatch] = useReducer(selectorReducer, initialState)
  const {
    dialogOpen,
    selectedAssetId,
    currentThumbnail,
    assets,
    loading,
    uploading,
    activeTab,
  } = state

  const loadAssets = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const result = await queryApi.assets.list.call({
        type: "images",
        limit: 100,
      })
      dispatch({ type: "SET_ASSETS", payload: result.assets as Asset[] })
    } catch (error) {
      logger.error(`Failed to load assets: ${formatError(error)}`)
    }
    dispatch({ type: "SET_LOADING", payload: false })
  }, [])

  const loadCurrentThumbnail = useCallback(async (id: string) => {
    try {
      const result = await queryApi.assets.list.call({ limit: 100 })
      const asset = (result.assets as Asset[]).find((a) => a.id === id)
      if (asset) {
        dispatch({ type: "SET_CURRENT_THUMBNAIL", payload: asset })
      }
    } catch (error) {
      logger.error(`Failed to load thumbnail: ${formatError(error)}`)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (dialogOpen && activeTab === "library") {
      const load = async () => {
        if (!cancelled) await loadAssets()
      }
      void load()
    }
    return () => {
      cancelled = true
    }
  }, [dialogOpen, activeTab, loadAssets])

  useEffect(() => {
    let cancelled = false
    const runEffect = async () => {
      if (value) {
        await loadCurrentThumbnail(value)
      } else if (!cancelled) {
        dispatch({ type: "SET_CURRENT_THUMBNAIL", payload: null })
      }
    }
    void runEffect()
    return () => {
      cancelled = true
    }
  }, [value, loadCurrentThumbnail])

  const handleSelect = () => {
    if (selectedAssetId) {
      onChange(selectedAssetId)
    }
    dispatch({ type: "CLOSE_DIALOG" })
  }

  const handleClear = () => {
    onChange(undefined)
    dispatch({ type: "SET_CURRENT_THUMBNAIL", payload: null })
  }

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      dispatch({ type: "SET_UPLOADING", payload: true })
      try {
        const asset = await queryApi.assets.upload.call(file)
        dispatch({ type: "PREPEND_ASSET", payload: asset as Asset })
        onChange(asset.id)
        dispatch({ type: "CLOSE_DIALOG" })
      } catch (error) {
        logger.error(`Upload failed: ${formatError(error)}`)
      }
      dispatch({ type: "SET_UPLOADING", payload: false })
      if (event.target) {
        event.target.value = ""
      }
    },
    [onChange],
  )

  return (
    <>
      <div className="border-border flex flex-col gap-3 rounded-lg border">
        <div className="border-border flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-semibold">Thumbnail</h4>
        </div>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <ThumbnailDisplay
            thumbnail={currentThumbnail}
            onChange={() => dispatch({ type: "OPEN_DIALOG" })}
            onClear={handleClear}
          />
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_DIALOG" })
          else dispatch({ type: "OPEN_DIALOG" })
        }}
      >
        <DialogPopup className="max-w-5xl">
          <div className="flex flex-col gap-4 p-6">
            <div className="shrink-0">
              <h2 className="text-lg font-semibold">Select Thumbnail</h2>
              <p className="text-muted-foreground text-sm">
                Choose an image from your library or upload a new one
              </p>
            </div>

            <div className="flex shrink-0 gap-2 border-b">
              <button
                type="button"
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "library"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
                onClick={() =>
                  dispatch({ type: "SET_TAB", payload: "library" })
                }
              >
                Library
              </button>
              <button
                type="button"
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
                onClick={() => dispatch({ type: "SET_TAB", payload: "upload" })}
              >
                Upload New
              </button>
            </div>

            {activeTab === "library" ? (
              <AssetLibrary
                assets={assets}
                selectedAssetId={selectedAssetId}
                loading={loading}
                onSelect={(id) =>
                  dispatch({ type: "SET_SELECTED_ASSET", payload: id })
                }
                onSwitchToUpload={() =>
                  dispatch({ type: "SET_TAB", payload: "upload" })
                }
                onConfirm={handleSelect}
                onCancel={() => dispatch({ type: "CLOSE_DIALOG" })}
              />
            ) : (
              <UploadTab
                uploading={uploading}
                onUpload={handleFileUpload}
                onCancel={() => dispatch({ type: "CLOSE_DIALOG" })}
              />
            )}
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}

export default ThumbnailSelector
