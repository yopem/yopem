"use client"

import { queryApi } from "@repo/orpc/query"
import { toastManager } from "@repo/ui/toast"
import { useMutation, useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { Suspense, useCallback, useState } from "react"

import { AssetCard, type Asset } from "@/components/assets/asset-card"
import { TypeFilter } from "@/components/assets/type-filter"
import { UploadDropzone } from "@/components/assets/upload-dropzone"
import { UploadProgress } from "@/components/assets/upload-progress"

const AssetPreviewDialog = dynamic(
  () =>
    import("@/components/assets/asset-preview-dialog").then(
      (mod) => mod.AssetPreviewDialog,
    ),
  { ssr: false },
)

const DeleteAssetDialog = dynamic(
  () =>
    import("@/components/assets/delete-asset-dialog").then(
      (mod) => mod.DeleteAssetDialog,
    ),
  { ssr: false },
)

const AssetSkeleton = dynamic(
  () =>
    import("@/components/assets/asset-skeleton").then(
      (mod) => mod.AssetSkeleton,
    ),
  { ssr: false },
)

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

function AssetsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center">
        <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground mt-2 text-sm">Loading assets...</p>
      </div>
    </div>
  )
}

export default function AssetsPage() {
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
    onError: (error: Error) => {
      toastManager.add({
        title: "Upload failed",
        description: error.message,
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
    onError: (error: Error) => {
      toastManager.add({
        title: "Delete failed",
        description: error.message,
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
    <Suspense fallback={<AssetsLoading />}>
      <div
        className="flex flex-1 flex-col gap-8 overflow-y-auto p-8"
        onPaste={handlePaste}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
            <p className="text-muted-foreground">
              Manage and organize your uploaded files. Max size: {maxSizeMB}MB
              per file.
            </p>
          </div>
        </div>

        <UploadDropzone onUpload={handleUpload} maxSizeMB={maxSizeMB} />

        <UploadProgress isUploading={uploadMutation.isPending} />

        <TypeFilter
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

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
    </Suspense>
  )
}
