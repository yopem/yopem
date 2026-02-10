"use client"

import {
  CheckCircleIcon,
  FileTextIcon,
  LoaderCircleIcon,
  PlayIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface FeatureBuilderHeaderProps {
  breadcrumbItems: BreadcrumbItem[]
  title?: string
  mode?: "create" | "edit"
  status?: "draft" | "active" | "archived"
  onPreviewRun?: () => void
  onSaveDraft?: () => void
  onPublish?: () => void
  isSaving?: boolean
}

const FeatureBuilderHeader = ({
  breadcrumbItems,
  mode = "create",
  status,
  onPreviewRun,
  onSaveDraft,
  onPublish,
  isSaving = false,
}: FeatureBuilderHeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-8">
      <div className="flex items-center gap-2">
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.href ? (
              <a
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-sm font-medium">{item.label}</span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span className="text-border text-sm">/</span>
            )}
          </div>
        ))}
        {status && (
          <span
            className={`ml-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              status === "active"
                ? "border-green-200 bg-green-50 text-green-700"
                : status === "draft"
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onPreviewRun}>
          <PlayIcon className="size-4" />
          <span>Preview</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <FileTextIcon className="size-4" />
          )}
          <span>Save as Draft</span>
        </Button>
        <Button size="sm" onClick={onPublish} disabled={isSaving}>
          {isSaving ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <CheckCircleIcon className="size-4" />
          )}
          <span>{mode === "edit" ? "Update" : "Publish"}</span>
        </Button>
      </div>
    </header>
  )
}

export default FeatureBuilderHeader
