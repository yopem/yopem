"use client"

import { Image as ImageIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import Link from "@/components/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

const ToolCard = ({
  slug,
  name,
  description,
  excerpt,
  costPerRun,
  categories = [],
  thumbnail,
  averageRating,
  reviewCount,
}: ToolCardProps) => {
  const isFree = Number(costPerRun ?? 0) === 0
  const [imageError, setImageError] = useState(false)
  const hasReviews = reviewCount && reviewCount > 0

  return (
    <Link
      href={`/marketplace/tools/${slug}`}
      className="block h-full cursor-pointer transition-colors hover:border-gray-300 dark:hover:border-gray-600"
    >
      <Card className="border-border bg-card rounded-lg border">
        {thumbnail && !imageError ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
            <Image
              src={thumbnail.url}
              alt={`${name} thumbnail`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-t-lg">
            <ImageIcon className="text-muted-foreground size-10" />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-1 text-base font-medium">
            {name}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 pb-2">
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {excerpt ?? description ?? "No description available"}
          </p>
        </CardContent>

        <div className="border-t px-4 py-3">
          <div className="flex w-full items-center justify-between text-sm">
            <span
              className={
                isFree ? "font-medium text-green-600" : "text-muted-foreground"
              }
            >
              {isFree ? "Free" : `${costPerRun} credits`}
            </span>
            <div className="flex items-center gap-2">
              {hasReviews && averageRating && (
                <div className="flex items-center gap-1">
                  <StarIcon className="size-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{averageRating.toFixed(1)}</span>
                </div>
              )}
              {categories.length > 0 && (
                <span className="text-muted-foreground text-xs">
                  {categories[0].name}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
