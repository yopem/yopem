"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "ui/button"

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  summaryLabel?: string
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  summaryLabel = "tools",
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="border-border flex items-center justify-between border-t pt-6">
      <span className="text-muted-foreground text-xs">
        Page {page} of {totalPages} ({totalItems} {summaryLabel})
      </span>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="gap-1 text-xs"
        >
          <ChevronLeftIcon className="size-3.5" />
          <span>Previous</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
