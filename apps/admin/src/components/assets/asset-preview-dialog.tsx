"use client"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogBackdrop,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
} from "@repo/ui/dialog"
import { Image } from "@unpic/react"
import { ImageIcon, XIcon } from "lucide-react"

import type { Asset } from "./asset-card"

interface AssetPreviewDialogProps {
  asset: Asset | null
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function AssetPreviewDialog({
  asset,
  onClose,
}: AssetPreviewDialogProps) {
  const isImage = asset?.type === "images"

  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogBackdrop />
      <DialogPopup className="max-w-4xl">
        {asset && (
          <>
            <DialogHeader>
              <p className="font-medium">{asset.originalName}</p>
              <p className="text-muted-foreground text-sm">
                {formatFileSize(asset.size)} • {asset.type}
              </p>
            </DialogHeader>
            <DialogPanel>
                {isImage ? (
                <div className="relative max-h-[70vh] w-full">
                  <Image
                    src={asset.url}
                    alt={asset.originalName}
                    layout="fullWidth"
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-muted flex aspect-video items-center justify-center">
                  <ImageIcon className="text-muted-foreground size-24" />
                </div>
              )}
            </DialogPanel>
            <DialogFooter variant="bare">
              <Button variant="outline" size="sm" onClick={onClose}>
                <XIcon className="mr-2 size-4" />
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  )
}
