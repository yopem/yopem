"use client"

import {
  CheckCircleIcon,
  FileTextIcon,
  LoaderCircleIcon,
  PlayIcon,
} from "lucide-react"

import { Badge } from "ui/badge"
import { Button } from "ui/button"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip"

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
  isLoading?: boolean
}

export function FeatureBuilderHeader({
  breadcrumbItems,
  mode = "create",
  status,
  onPreviewRun,
  onSaveDraft,
  onPublish,
  isSaving = false,
  isLoading = false,
}: FeatureBuilderHeaderProps) {
  const statusVariant =
    status === "active"
      ? "success"
      : status === "draft"
        ? "secondary"
        : "outline"

  return (
    <header className="border-border flex h-16 shrink-0 items-center justify-between border-b px-8">
      <div className="flex items-center gap-2">
        {breadcrumbItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
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
            {breadcrumbItems.indexOf(item) < breadcrumbItems.length - 1 && (
              <span className="text-border text-sm">/</span>
            )}
          </div>
        ))}
        {status && (
          <Badge variant={statusVariant} className="ml-2 capitalize">
            {status}
          </Badge>
        )}
      </div>
      <TooltipProvider>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviewRun}
                  disabled={isLoading}
                >
                  <PlayIcon className="size-4" />
                  <span>Preview</span>
                </Button>
              }
            />
            <TooltipPopup side="bottom">
              Run the product once with sample inputs
            </TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
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
              }
            />
            <TooltipPopup side="bottom">
              Save without publishing so you can keep editing
            </TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button size="sm" onClick={onPublish} disabled={isSaving}>
                  {isSaving ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="size-4" />
                  )}
                  <span>{mode === "edit" ? "Update" : "Publish"}</span>
                </Button>
              }
            />
            <TooltipPopup side="bottom">
              {mode === "edit"
                ? "Save your changes and make them live"
                : "Make the product available to users"}
            </TooltipPopup>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  )
}
