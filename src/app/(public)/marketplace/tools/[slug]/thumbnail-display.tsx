"use client"

import { Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface ThumbnailDisplayProps {
  thumbnail: { id: string; url: string; originalName: string }
  name: string
}

const ThumbnailDisplay = ({ thumbnail, name }: ThumbnailDisplayProps) => {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="bg-muted mb-6 flex aspect-video w-full items-center justify-center rounded-lg">
        <ImageIcon className="text-muted-foreground size-16" />
      </div>
    )
  }

  return (
    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
      <Image
        src={thumbnail.url}
        alt={`${name} thumbnail`}
        fill
        className="object-cover"
        priority
        onError={() => setImageError(true)}
      />
    </div>
  )
}

export default ThumbnailDisplay
