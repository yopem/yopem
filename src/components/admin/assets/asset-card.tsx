"use client"

import { ImageIcon, Trash2Icon } from "lucide-react"
import Image from "next/image"
import { memo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDateOnly } from "@/lib/utils/format-date"

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

export interface Asset {
  id: string
  filename: string
  originalName: string
  type: AssetType
  size: number
  url: string
  createdAt: Date
}

interface AssetCardProps {
  asset: Asset
  onPreview: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function AssetCardComponent({ asset, onPreview, onDelete }: AssetCardProps) {
  const isImage = asset.type === "images"

  return (
    <Card
      className="group cursor-pointer overflow-hidden"
      onClick={() => onPreview(asset)}
    >
      <CardContent className="relative aspect-square p-0">
        {isImage ? (
          <Image
            src={asset.url}
            alt={asset.originalName}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted flex size-full items-center justify-center">
            <ImageIcon className="text-muted-foreground size-12" />
          </div>
        )}
        <div className="absolute inset-0 flex items-start justify-end gap-1 bg-linear-to-b from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(asset)
            }}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
      <CardHeader className="p-3">
        <p className="truncate text-sm font-medium">{asset.originalName}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {asset.type}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatFileSize(asset.size)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {formatDateOnly(asset.createdAt)}
        </p>
      </CardHeader>
    </Card>
  )
}

export const AssetCard = memo(AssetCardComponent)
