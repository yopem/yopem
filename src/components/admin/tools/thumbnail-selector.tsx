"use client"

import { Image as ImageIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { queryApi } from "@/lib/orpc/query"

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

  useEffect(() => {
    if (dialogOpen) {
      void loadAssets()
    }
  }, [dialogOpen])

  useEffect(() => {
    if (value) {
      void loadCurrentThumbnail(value)
    } else {
      setCurrentThumbnail(null)
    }
  }, [value])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const result = await queryApi.assets.list.call({
        type: "images",
        limit: 50,
      })
      setAssets(result.assets as Asset[])
    } catch (error) {
      console.error("Failed to load assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentThumbnail = async (id: string) => {
    try {
      const result = await queryApi.assets.list.call({ limit: 100 })
      const asset = (result.assets as Asset[]).find((a) => a.id === id)
      if (asset) {
        setCurrentThumbnail(asset)
      }
    } catch (error) {
      console.error("Failed to load thumbnail:", error)
    }
  }

  const handleSelect = () => {
    if (selectedAssetId) {
      onChange(selectedAssetId)
    }
    setDialogOpen(false)
    setSelectedAssetId(null)
  }

  const handleClear = () => {
    onChange(undefined)
    setCurrentThumbnail(null)
  }

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
        <DialogPopup>
          <div className="flex flex-col gap-4 p-6" style={{ width: 500 }}>
            <div>
              <h2 className="text-lg font-semibold">Select Thumbnail</h2>
              <p className="text-muted-foreground text-sm">
                Choose an image from your assets library
              </p>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <ImageIcon className="text-muted-foreground size-8" />
                <p className="text-muted-foreground text-sm">
                  No images available
                </p>
                <p className="text-muted-foreground text-xs">
                  Upload images in the Assets page first
                </p>
              </div>
            ) : (
              <div className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto">
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
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}

export default ThumbnailSelector
