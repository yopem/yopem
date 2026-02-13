"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useCallback, useState } from "react"

import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

import { AssetCard, type Asset } from "./asset-card"
import { TypeFilter } from "./type-filter"
import { UploadDropzone } from "./upload-dropzone"
import { UploadProgress } from "./upload-progress"

const AssetPreviewDialog = dynamic(
  () => import("./asset-preview-dialog").then((mod) => mod.AssetPreviewDialog),
  { ssr: false },
)

const DeleteAssetDialog = dynamic(
  () => import("./delete-asset-dialog").then((mod) => mod.DeleteAssetDialog),
  { ssr: false },
)

const AssetSkeleton = dynamic(
  () => import("./asset-skeleton").then((mod) => mod.AssetSkeleton),
  { ssr: false },
)

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

export function AssetsContainer() {
  const [selectedType, setSelectedType] = useState<AssetType | "all">("all")
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)

  const { data: settings } = useQuery({
    ...queryApi.assets.getUploadSettings.queryOptions(),
  })

  const maxSizeMB = settings?.maxSizeMB ?? 50

  const {
    data: assetsData,
    isLoading,
    refetch,
  } = useQuery({
    ...queryApi.assets.list.queryOptions({
      input: {
        limit: 50,
        type: selectedType === "all" ? undefined : selectedType,
      },
    }),
  })

  const assets = (assetsData?.assets as Asset[]) ?? []

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await queryApi.assets.upload.call(file)
    },
    onSuccess: () => {
      toastManager.add({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
        type: "success",
      })
      void refetch()
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Upload failed",
        description: err.message,
        type: "error",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await queryApi.assets.delete.call({ id })
    },
    onSuccess: () => {
      toastManager.add({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
        type: "success",
      })
      setDeleteAsset(null)
      void refetch()
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Delete failed",
        description: err.message,
        type: "error",
      })
    },
  })

  const handleUpload = useCallback(
    (file: File) => {
      uploadMutation.mutate(file)
    },
    [uploadMutation],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      items.forEach((item) => {
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) {
            if (file.size > maxSizeMB * 1024 * 1024) {
              toastManager.add({
                title: "File too large",
                description: `File size exceeds ${maxSizeMB}MB limit`,
                type: "error",
              })
              return
            }
            handleUpload(file)
          }
        }
      })
    },
    [handleUpload, maxSizeMB],
  )

  return (
    <div
      className="flex flex-1 flex-col gap-8 overflow-y-auto p-8"
      onPaste={handlePaste}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage and organize your uploaded files. Max size: {maxSizeMB}MB per
            file.
          </p>
        </div>
      </div>

      <UploadDropzone onUpload={handleUpload} maxSizeMB={maxSizeMB} />

      <UploadProgress isUploading={uploadMutation.isPending} />

      <TypeFilter selectedType={selectedType} onTypeChange={setSelectedType} />

      {isLoading ? (
        <AssetSkeleton />
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-muted-foreground text-lg">No assets yet</p>
          <p className="text-muted-foreground text-sm">
            Upload your first file to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onPreview={setPreviewAsset}
              onDelete={setDeleteAsset}
            />
          ))}
        </div>
      )}

      <AssetPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />

      <DeleteAssetDialog
        asset={deleteAsset}
        onClose={() => setDeleteAsset(null)}
        onConfirm={() => deleteAsset && deleteMutation.mutate(deleteAsset.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
