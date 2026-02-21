"use client"

import { Button } from "@repo/ui/button"
import { Upload as UploadIcon } from "lucide-react"

interface UploadTabProps {
  uploading: boolean
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
}

const UploadTab = ({ uploading, onUpload, onCancel }: UploadTabProps) => {
  return (
    <>
      <div className="shrink">
        <div className="hover:border-muted-foreground flex h-60 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
            id="thumbnail-upload"
          />
          <label
            htmlFor="thumbnail-upload"
            className="flex size-full cursor-pointer flex-col items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="border-primary mb-2 size-8 animate-spin rounded-full border-2 border-t-transparent" />
                <p className="text-muted-foreground text-sm">Uploading...</p>
              </>
            ) : (
              <>
                <UploadIcon className="text-muted-foreground mb-2 size-12" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-muted-foreground text-xs">
                  PNG, JPG, GIF, WebP up to 50MB
                </p>
              </>
            )}
          </label>
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

export default UploadTab
