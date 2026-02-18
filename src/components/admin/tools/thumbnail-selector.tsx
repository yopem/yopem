"use client"

import { Image as ImageIcon, Upload as UploadIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"
import { logger } from "@/lib/utils/logger"

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

export function ThumbnailSelector({ value, onChange }: ThumbnailSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [currentThumbnail, setCurrentThumbnail] = useState<Asset | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library")

  const loadAssets = useCallback(async () => {
    setLoading(true)
    try {
      const result = await queryApi.assets.list.call({
        type: "images",
        limit: 100,
      })
      setAssets(result.assets as Asset[])
    } catch (error) {
      logger.error(`Failed to load assets: ${String(error)}`)
    }
    setLoading(false)
  }, [])

  const loadCurrentThumbnail = useCallback(async (id: string) => {
    try {
      const result = await queryApi.assets.list.call({ limit: 100 })
      const asset = (result.assets as Asset[]).find((a) => a.id === id)
      if (asset) {
        setCurrentThumbnail(asset)
      }
    } catch (error) {
      logger.error(`Failed to load thumbnail: ${String(error)}`)
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
        setCurrentThumbnail(null)
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
    setDialogOpen(false)
    setSelectedAssetId(null)
    setActiveTab("library")
  }

  const handleClear = () => {
    onChange(undefined)
    setCurrentThumbnail(null)
  }

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const asset = await queryApi.assets.upload.call(file)
        setAssets((prev) => [asset as Asset, ...prev])
        onChange(asset.id)
        setDialogOpen(false)
        toastManager.add({
          title: "Upload successful",
          description: "Thumbnail has been uploaded",
          type: "success",
        })
      } catch (error) {
        toastManager.add({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Unknown error",
          type: "error",
        })
      }
      setUploading(false)
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
          {currentThumbnail ? (
            <div className="relative flex flex-col gap-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                <Image
                  src={currentThumbnail.url}
                  alt={currentThumbnail.originalName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDialogOpen(true)}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                className="w-full"
              >
                <ImageIcon className="mr-2 size-4" />
                Select Thumbnail
              </Button>
              <p className="text-muted-foreground text-xs">
                Add an image to make your tool stand out
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                onClick={() => setActiveTab("library")}
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
                onClick={() => setActiveTab("upload")}
              >
                Upload New
              </button>
            </div>

            {activeTab === "library" ? (
              <>
                <div className="min-h-0 shrink">
                  {loading ? (
                    <div className="flex h-60 items-center justify-center">
                      <p className="text-muted-foreground">Loading assets...</p>
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="flex h-60 flex-col items-center justify-center gap-2">
                      <ImageIcon className="text-muted-foreground size-12" />
                      <p className="text-muted-foreground text-sm">
                        No images available
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("upload")}
                      >
                        <UploadIcon className="mr-2 size-4" />
                        Upload New Image
                      </Button>
                    </div>
                  ) : (
                    <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-colors ${
                            selectedAssetId === asset.id
                              ? "border-primary"
                              : "hover:border-muted-foreground border-transparent"
                          }`}
                          onClick={() => setSelectedAssetId(asset.id)}
                        >
                          <Image
                            src={asset.url}
                            alt={asset.originalName}
                            fill
                            className="bg-muted object-contain p-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setActiveTab("library")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSelect}
                    disabled={!selectedAssetId}
                  >
                    Select
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="shrink">
                  <div className="hover:border-muted-foreground flex h-60 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="flex size-full cursor-pointer flex-col items-center justify-center"
                    >
                      {uploading ? (
                        <>
                          <div className="border-primary mb-2 size-8 animate-spin rounded-full border-2 border-t-transparent" />
                          <p className="text-muted-foreground text-sm">
                            Uploading...
                          </p>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="text-muted-foreground mb-2 size-12" />
                          <p className="text-sm font-medium">Click to upload</p>
                          <p className="text-muted-foreground text-xs">
                            PNG, JPG, GIF, WebP up to 50MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      setActiveTab("library")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}

export default ThumbnailSelector
