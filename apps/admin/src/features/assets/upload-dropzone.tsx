"use client"

import { UploadIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Card, CardPanel } from "ui/card"
import { toastManager } from "ui/toast"

interface UploadDropzoneProps {
  onUpload: (file: File) => void
  maxSizeMB: number
}

export function UploadDropzone({ onUpload, maxSizeMB }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toastManager.add({
            title: "File too large",
            description: `File size exceeds ${maxSizeMB}MB limit`,
            type: "error",
          })
          return
        }
        onUpload(file)
      })
    },
    [onUpload, maxSizeMB],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(Array.from(e.dataTransfer.files))
    },
    [handleFiles],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(Array.from(e.target.files ?? []))
      e.target.value = ""
    },
    [handleFiles],
  )

  return (
    <Card
      className={`cursor-pointer border-2 border-dashed transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <CardPanel className="flex flex-col items-center justify-center gap-4 py-12">
        <UploadIcon className="text-muted-foreground size-12" />
        <div className="text-center">
          <p className="font-medium">Click to upload or drag and drop</p>
          <p className="text-muted-foreground text-sm">
            You can also paste files from clipboard
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardPanel>
    </Card>
  )
}
