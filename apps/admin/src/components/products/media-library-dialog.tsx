"use client"

import type { PlateEditor } from "platejs/react"

import { insertImage } from "@platejs/media"
import { useQuery } from "@tanstack/react-query"
import { FileIcon, ImageIcon, SearchIcon, VideoIcon } from "lucide-react"
import { KEYS } from "platejs"
import { useState } from "react"

import type { SelectAsset } from "db/schema"
import { queryApi } from "rpc/query"
import { cn } from "ui"
import { Button } from "ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog"
import { Input } from "ui/input"
import { ScrollArea } from "ui/scroll-area"
import { Tabs, TabsList, TabsTab } from "ui/tabs"

interface MediaLibraryDialogProps {
  editor: PlateEditor
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TABS = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "documents", label: "Documents" },
  { id: "others", label: "Others" },
] as const

type FilterType = (typeof TABS)[number]["id"]

const AssetPreview = ({ asset }: { asset: SelectAsset }) => {
  if (asset.type === "images") {
    return (
      <img
        src={asset.url}
        alt={asset.originalName}
        className="bg-muted size-full rounded-md object-cover"
        loading="lazy"
      />
    )
  }

  if (asset.type === "videos") {
    return (
      <div className="bg-muted flex size-full items-center justify-center rounded-md">
        <VideoIcon className="text-muted-foreground size-8" />
      </div>
    )
  }

  return (
    <div className="bg-muted flex size-full items-center justify-center rounded-md">
      <FileIcon className="text-muted-foreground size-8" />
    </div>
  )
}

const insertAssetIntoEditor = (editor: PlateEditor, asset: SelectAsset) => {
  if (asset.type === "images") {
    insertImage(editor, asset.url, { select: true })
    return
  }

  editor.tf.insertNodes(
    {
      type: KEYS.file,
      url: asset.url,
      name: asset.originalName,
      children: [{ text: "" }],
    },
    { select: true },
  )
}

const MediaLibraryDialog = ({
  editor,
  open,
  onOpenChange,
}: MediaLibraryDialogProps) => {
  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")

  const assetType = filter === "all" ? undefined : filter

  const { data, isLoading } = useQuery({
    ...queryApi.assets.list.queryOptions({
      input: { limit: 100, type: assetType },
    }),
    enabled: open,
  })

  const assets = data?.assets ?? []

  const filteredAssets = search.trim()
    ? assets.filter((asset) =>
        asset.originalName.toLowerCase().includes(search.toLowerCase()),
      )
    : assets

  const handleSelect = (asset: SelectAsset) => {
    insertAssetIntoEditor(editor, asset)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Choose an image or file from your assets to insert into the
            description.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="ps-9"
            />
          </div>

          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <TabsList>
              {TABS.map((tab) => (
                <TabsTab key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTab>
              ))}
            </TabsList>
          </Tabs>

          <ScrollArea className="h-[360px]">
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted aspect-square animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-sm">
                <ImageIcon className="size-8" />
                <p>No assets found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleSelect(asset)}
                    className={cn(
                      "group focus-visible:ring-ring hover:bg-accent flex flex-col gap-2 rounded-md p-2 text-start transition-colors outline-none focus-visible:ring-2",
                    )}
                  >
                    <div className="aspect-square overflow-hidden rounded-md">
                      <AssetPreview asset={asset} />
                    </div>
                    <span className="line-clamp-2 text-xs">
                      {asset.originalName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MediaLibraryDialog
