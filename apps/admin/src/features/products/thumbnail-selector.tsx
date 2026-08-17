"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { queryApi } from "rpc/query"
import { CollapsibleCard } from "ui/collapsible-card"

import {
  ImageAssetPicker,
  type ImageAsset,
} from "@/features/assets/image-asset-picker"

import { ThumbnailDisplay } from "./thumbnail-display"

interface ThumbnailSelectorProps {
  value?: string
  onChange: (value: string | undefined) => void
}

export function ThumbnailSelector({ value, onChange }: ThumbnailSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data } = useQuery(
    queryApi.assets.list.queryOptions({
      input: { limit: 100 },
      enabled: Boolean(value),
    }),
  )
  const currentThumbnail =
    data?.assets.find((asset) => asset.id === value) ?? null

  const handleClear = () => {
    onChange(undefined)
  }

  const handleSelect = (asset: ImageAsset) => {
    onChange(asset.id)
  }

  return (
    <>
      <CollapsibleCard title="Thumbnail">
        <ThumbnailDisplay
          thumbnail={currentThumbnail}
          onChange={() => setDialogOpen(true)}
          onClear={handleClear}
        />
      </CollapsibleCard>

      <ImageAssetPicker
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={handleSelect}
        title="Select Thumbnail"
        description="Choose an image from your library or upload a new one"
      />
    </>
  )
}
