"use client"

import {
  LoaderCircle as LoaderCircleIcon,
  Play as PlayIcon,
  Save as SaveIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface FeatureBuilderHeaderProps {
  breadcrumbItems: BreadcrumbItem[]
  title?: string
  status?: string
  onTestRun?: () => void
  onSave?: () => void
  isSaving?: boolean
}

const FeatureBuilderHeader = ({
  breadcrumbItems,
  status,
  onTestRun,
  onSave,
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
          <span className="bg-muted ml-2 rounded-full border px-2 py-0.5 text-xs font-semibold">
            {status}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onTestRun}>
          <PlayIcon className="size-4" />
          <span>Test Run</span>
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </Button>
      </div>
    </header>
  )
}

export default FeatureBuilderHeader
