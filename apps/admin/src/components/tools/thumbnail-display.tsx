"use client"

import { Button } from "@repo/ui/button"
import { Image as ImageIcon, XIcon } from "lucide-react"
import Image from "next/image"

interface Asset {
  id: string
  url: string
  originalName: string
  type: string
}

interface ThumbnailDisplayProps {
  thumbnail: Asset | null
  onChange: () => void
  onClear: () => void
}

const ThumbnailDisplay = ({
  thumbnail,
  onChange,
  onClear,
}: ThumbnailDisplayProps) => {
  if (thumbnail) {
    return (
      <div className="relative flex flex-col gap-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border">
          <Image
            src={thumbnail.url}
            alt={thumbnail.originalName}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover"
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
        Add an image to make your tool stand out
      </p>
    </div>
  )
}

export default ThumbnailDisplay
