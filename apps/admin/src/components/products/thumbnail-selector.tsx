"use client"

import { useCallback, useEffect, useState } from "react"

import type { SelectAsset } from "db/schema/assets"
import { queryApi } from "rpc/query"
import { CollapsibleCard } from "ui/collapsible-card"

import {
  ImageAssetPicker,
  type ImageAsset,
} from "@/components/assets/image-asset-picker"

import { ThumbnailDisplay } from "./thumbnail-display"

type Asset = Pick<SelectAsset, "id" | "url" | "originalName" | "type">

interface ThumbnailSelectorProps {
  value?: string
  onChange: (value: string | undefined) => void
}

export function ThumbnailSelector({ value, onChange }: ThumbnailSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentThumbnail, setCurrentThumbnail] = useState<Asset | null>(null)

  const loadCurrentThumbnail = useCallback(async (id: string) => {
    try {
      const result = await queryApi.assets.list.call({ limit: 100 })
      const asset = (result.assets as Asset[]).find((a) => a.id === id)
      if (asset) {
        setCurrentThumbnail(asset)
      }
    } catch (error) {
      console.error("Failed to load thumbnail:", error)
    }
  }, [])

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

  const handleClear = () => {
    onChange(undefined)
    setCurrentThumbnail(null)
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
