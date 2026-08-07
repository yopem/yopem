"use client"

import { Image } from "@unpic/react"
import { ImageIcon, LinkIcon, Trash2Icon } from "lucide-react"
import { memo } from "react"

import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Card, CardHeader, CardPanel } from "ui/card"
import { Checkbox } from "ui/checkbox"
import { formatDateOnly } from "utils/format-date"
import { formatFileSize } from "utils/format-file-size"

import { handleCopyUrl } from "@/lib/utils/copy-url"

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
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  onPreview: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}

export const AssetCard = memo(
  ({
    asset,
    isSelected,
    onToggleSelect,
    onPreview,
    onDelete,
  }: AssetCardProps) => {
    const isImage = asset.type === "images"

    return (
      <Card
        className={`group cursor-pointer overflow-hidden ${
          isSelected ? "ring-primary ring-2" : ""
        }`}
        onClick={() => onPreview(asset)}
      >
        <CardPanel className="relative aspect-square p-0">
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(asset.id)}
            />
          </div>
          {isImage ? (
            <Image
              src={asset.url}
              alt={asset.originalName}
              layout="fullWidth"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="bg-muted flex size-full items-center justify-center">
              <ImageIcon className="text-muted-foreground size-12" />
            </div>
          )}
          <div className="absolute inset-0 flex items-start justify-end gap-1 bg-linear-to-b from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                void handleCopyUrl(asset.url)
              }}
            >
              <LinkIcon className="size-4" />
            </Button>
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
        </CardPanel>
        <CardHeader className="p-3">
          <p className="truncate text-sm font-medium">{asset.filename}</p>
          <p className="text-muted-foreground truncate text-xs">
            {asset.originalName}
          </p>
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
  },
)
