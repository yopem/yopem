"use client"

import { Link } from "@tanstack/react-router"
import { Image } from "@unpic/react"
import { StarIcon } from "lucide-react"
import { useState } from "react"

import { Card } from "ui/card"

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

const ToolAvatar = ({
  name,
  thumbnail,
}: {
  name: string
  thumbnail?: { id: string; url: string } | null
}) => {
  const [imageError, setImageError] = useState(false)

  if (thumbnail && !imageError) {
    return (
      <Image
        src={thumbnail.url}
        alt={`${name} icon`}
        width={40}
        height={40}
        className="size-10 rounded-lg object-cover"
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

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
  const hasReviews = reviewCount && reviewCount > 0

  return (
    <Link
      to="/marketplace/tools/$slug"
      params={{ slug }}
      className="group block h-full outline-none"
    >
      <Card className="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-4 shadow-none transition-all duration-150 hover:border-gray-300 hover:shadow-sm dark:hover:border-gray-700">
        <div className="flex items-start gap-3">
          <ToolAvatar name={name} thumbnail={thumbnail} />
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground group-hover:text-primary line-clamp-3 text-sm font-semibold transition-colors">
              {name}
            </h3>
            {categories.length > 0 && (
              <span className="text-muted-foreground text-xs">
                {categories[0].name}
              </span>
            )}
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-2 flex-1 text-xs/relaxed">
          {excerpt ?? description ?? "No description available"}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              isFree
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            {isFree ? "Free" : `${costPerRun} credits/run`}
          </span>
          {hasReviews && averageRating && (
            <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
              <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
              <span className="opacity-60">·</span>
              <span className="opacity-60">{reviewCount}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
