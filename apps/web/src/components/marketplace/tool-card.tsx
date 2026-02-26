"use client"

import { Card } from "@repo/ui/card"
import { Link } from "@tanstack/react-router"
import { Image as ImageIcon, StarIcon } from "lucide-react"
import { Image } from "@unpic/react"
import { useState } from "react"

export interface ToolCardProps {
  slug: string
  name: string
  description: string | null
  excerpt?: string | null
  costPerRun: string | null
  categories?: { id: string; name: string; slug: string }[]
  thumbnail?: { id: string; url: string } | null
  averageRating?: number | null
  reviewCount?: number
}

const EMPTY_CATEGORIES: { id: string; name: string; slug: string }[] = []

const ToolCard = ({
  slug,
  name,
  description,
  excerpt,
  costPerRun,
  categories = EMPTY_CATEGORIES,
  thumbnail,
  averageRating,
  reviewCount,
}: ToolCardProps) => {
  const isFree = Number(costPerRun ?? 0) === 0
  const [imageError, setImageError] = useState(false)
  const hasReviews = reviewCount && reviewCount > 0

  return (
    <Link
      to="/marketplace/tools/$slug"
      params={{ slug }}
      className="group block h-full outline-none"
    >
      <Card className="border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700">
        <div className="bg-muted/30 relative aspect-video w-full overflow-hidden">
          {thumbnail && !imageError ? (
            <Image
              src={thumbnail.url}
              alt={`${name} thumbnail`}
              layout="fullWidth"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="text-muted-foreground/40 size-10" />
            </div>
          )}
          {categories.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className="bg-background/95 border-border/50 rounded-md border px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase shadow-sm backdrop-blur-sm">
                {categories[0].name}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-lg font-semibold tracking-tight transition-colors">
              {name}
            </h3>
            {hasReviews && averageRating && (
              <div className="flex shrink-0 items-center gap-1 rounded-md bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-500">
                <StarIcon className="size-3 fill-current" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground mb-4 line-clamp-2 flex-1 text-sm/relaxed">
            {excerpt ?? description ?? "No description available"}
          </p>

          <div className="border-border/50 mt-auto flex items-center justify-between border-t pt-4">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                isFree
                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isFree ? "Free to use" : `${costPerRun} credits/run`}
            </span>
            <span className="text-primary -translate-x-2 text-sm font-medium opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              Try tool &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
