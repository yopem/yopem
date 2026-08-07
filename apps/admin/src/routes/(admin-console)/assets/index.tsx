import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { lazy, useCallback, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Checkbox } from "ui/checkbox"
import { Spinner } from "ui/spinner"
import { toastManager } from "ui/toast"

import { AssetCard, type Asset } from "@/components/assets/asset-card"
import { AssetTypeFilter } from "@/components/assets/asset-type-filter"
import { UploadDropzone } from "@/components/assets/upload-dropzone"
import { UploadProgress } from "@/components/assets/upload-progress"
import { DeleteDialog } from "@/components/delete-dialog"
import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"
import { GlobalPageHeader } from "@/components/layout/global-page-header"

const AssetPreviewDialog = lazy(() =>
  import("@/components/assets/asset-preview-dialog").then((mod) => ({
    default: mod.AssetPreviewDialog,
  })),
)

export const Route = createFileRoute("/(admin-console)/assets/")({
  component: AssetsRouteComponent,
})

type AssetType = "images" | "videos" | "documents" | "archives" | "others"

function AssetsRouteComponent() {
  const [selectedType, setSelectedType] = useState<AssetType | "all">("all")
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const { data: settings } = useQuery(
    queryApi.assets.uploadSettings.queryOptions(),
  )

  const maxSizeMB = settings?.maxSizeMB ?? 50

  const {
    data: assetsData,
    isLoading,
    refetch,
  } = useQuery(
    queryApi.assets.list.queryOptions({
      input: {
        limit: 50,
        type: selectedType === "all" ? undefined : selectedType,
      },
    }),
  )

  const assets = (assetsData?.assets as Asset[]) ?? []

  const uploadMutation = useMutation(
    queryApi.assets.upload.mutationOptions({
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
    }),
  )

  const deleteMutation = useMutation(
    queryApi.assets.delete.mutationOptions({
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
    }),
  )

  const bulkDeleteAssetsMutation = useMutation(
    queryApi.assets.bulkDelete.mutationOptions({
      onSuccess: (data) => {
        toastManager.add({
          title: "Assets deleted",
          description: `${data.count} asset${data.count === 1 ? "" : "s"} deleted.`,
          type: "success",
        })
        setSelectedAssetIds([])
        setBulkDeleteDialogOpen(false)
        void refetch()
      },
      onError: (error: Error) => {
        toastManager.add({
          title: "Delete failed",
          description: error.message,
          type: "error",
        })
      },
    }),
  )

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedAssetIds(assets.map((a) => a.id))
      } else {
        setSelectedAssetIds([])
      }
    },
    [assets],
  )

  const handleUpload = useCallback(
    (file: File) => {
      const cleanName = file.name.replace(/^.*[/\\]/, "")
      const cleanFile =
        cleanName === file.name
          ? file
          : new File([file], cleanName, { type: file.type })
      uploadMutation.mutate(cleanFile)
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

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Assets" }]

  return (
    <div
      className="mx-auto flex w-full max-w-350 flex-1 flex-col gap-8 overflow-y-auto p-8"
      onPaste={handlePaste}
    >
      <GlobalBreadcrumb items={breadcrumbItems} />
      <GlobalPageHeader
        title="Assets"
        description={`Manage and organize your uploaded files. Max size: ${maxSizeMB}MB per file.`}
      />

      <UploadDropzone onUpload={handleUpload} maxSizeMB={maxSizeMB} />

      <UploadProgress isUploading={uploadMutation.isPending} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <AssetTypeFilter
          selectedType={selectedType}
          onTypeChange={(type) => {
            setSelectedType(type)
            setSelectedAssetIds([])
          }}
        />
        {assets.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  assets.length > 0 && selectedAssetIds.length === assets.length
                }
                indeterminate={
                  selectedAssetIds.length > 0 &&
                  selectedAssetIds.length !== assets.length
                }
                onCheckedChange={handleToggleAll}
              />
              <span className="text-muted-foreground text-sm">Select all</span>
            </div>
            {selectedAssetIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={bulkDeleteAssetsMutation.isPending}
              >
                Delete Selected ({selectedAssetIds.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center p-8">
          <Spinner className="text-muted-foreground size-8" />
        </div>
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
              isSelected={selectedAssetIds.includes(asset.id)}
              onToggleSelect={handleToggleSelect}
              onPreview={setPreviewAsset}
              onDelete={setDeleteAsset}
            />
          ))}
        </div>
      )}

      <AssetPreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onDelete={(asset) => {
          setPreviewAsset(null)
          setDeleteAsset(asset)
        }}
      />

      <DeleteDialog
        open={deleteAsset !== null}
        onOpenChange={(open) => !open && setDeleteAsset(null)}
        title="Delete Asset"
        name={deleteAsset?.originalName}
        onConfirm={() =>
          deleteAsset && deleteMutation.mutate({ id: deleteAsset.id })
        }
        isPending={deleteMutation.isPending}
      />

      <DeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title={`Delete ${selectedAssetIds.length} asset${selectedAssetIds.length === 1 ? "" : "s"}?`}
        description={`Are you sure you want to delete ${selectedAssetIds.length} selected asset${selectedAssetIds.length === 1 ? "" : "s"}? This action cannot be undone.`}
        onConfirm={() =>
          bulkDeleteAssetsMutation.mutate({ ids: selectedAssetIds })
        }
        isPending={bulkDeleteAssetsMutation.isPending}
      />
    </div>
  )
}
