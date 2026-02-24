"use client"

import { Progress, ProgressIndicator, ProgressTrack } from "@repo/ui/progress"

interface UploadProgressProps {
  isUploading: boolean
}

export function UploadProgress({ isUploading }: UploadProgressProps) {
  if (!isUploading) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Uploading...</p>
      <Progress value={null}>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>
    </div>
  )
}
