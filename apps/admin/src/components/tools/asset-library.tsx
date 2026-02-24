"use client"

import { Button } from "@repo/ui/button"
import { Image as ImageIcon, Upload as UploadIcon } from "lucide-react"
import Image from "next/image"

interface Asset {
  id: string
  url: string
  originalName: string
  type: string
}

interface AssetLibraryProps {
  assets: Asset[]
  selectedAssetId: string | null
  loading: boolean
  onSelect: (assetId: string) => void
  onSwitchToUpload: () => void
  onConfirm: () => void
  onCancel: () => void
}

const AssetLibrary = ({
  assets,
  selectedAssetId,
  loading,
  onSelect,
  onSwitchToUpload,
  onConfirm,
  onCancel,
}: AssetLibraryProps) => {
  if (loading) {
    return (
      <>
        <div className="min-h-0 shrink">
          <div className="flex h-60 items-center justify-center">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!selectedAssetId}>
            Select
          </Button>
        </div>
      </>
    )
  }

  if (assets.length === 0) {
    return (
      <>
        <div className="min-h-0 shrink">
          <div className="flex h-60 flex-col items-center justify-center gap-2">
            <ImageIcon className="text-muted-foreground size-12" />
            <p className="text-muted-foreground text-sm">No images available</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToUpload}
            >
              <UploadIcon className="mr-2 size-4" />
              Upload New Image
            </Button>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="min-h-0 shrink">
        <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              role="button"
              tabIndex={0}
              className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 transition-colors ${
                selectedAssetId === asset.id
                  ? "border-primary"
                  : "hover:border-muted-foreground border-transparent"
              }`}
              onClick={() => onSelect(asset.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelect(asset.id)
                }
              }}
            >
              <Image
                src={asset.url}
                alt={asset.originalName}
                fill
                sizes="(max-width: 768px) 50vw, 150px"
                className="bg-muted object-contain p-2"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onConfirm} disabled={!selectedAssetId}>
          Select
        </Button>
      </div>
    </>
  )
}

export default AssetLibrary
