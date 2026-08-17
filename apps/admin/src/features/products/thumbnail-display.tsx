"use client"

import { Image } from "@unpic/react"
import { Image as ImageIcon, XIcon } from "lucide-react"

import type { SelectAsset } from "db/schema/assets"
import { Button } from "ui/button"

interface ThumbnailDisplayProps {
  thumbnail: Pick<SelectAsset, "id" | "url" | "originalName" | "type"> | null
  onChange: () => void
  onClear: () => void
}

export function ThumbnailDisplay({
  thumbnail,
  onChange,
  onClear,
}: ThumbnailDisplayProps) {
  if (thumbnail) {
    return (
      <div className="relative flex flex-col gap-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border">
          <Image
            src={thumbnail.url}
            alt={thumbnail.originalName}
            layout="fullWidth"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onChange}
          >
            Change
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onChange}
        className="w-full"
      >
        <ImageIcon className="mr-2 size-4" />
        Select Thumbnail
      </Button>
      <p className="text-muted-foreground text-xs">
        Add an image to make your product stand out
      </p>
    </div>
  )
}
