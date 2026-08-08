"use client"

import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { Card } from "ui/card"

export interface ProductCardProps {
  product: {
    id: string
    slug: string
    name: string
    excerpt?: string | null
    description?: string | null
    creditsPerRun?: number | null
    thumbnail?: { id: string; url: string } | null
    categories?: { id: string; name: string; slug: string }[]
  }
}

function ProductAvatar({
  name,
  thumbnail,
}: {
  name: string
  thumbnail?: { id: string; url: string } | null
}) {
  const [imageError, setImageError] = useState(false)

  if (thumbnail?.url && !imageError) {
    return (
      <img
        src={thumbnail.url}
        alt={`${name} icon`}
        width={40}
        height={40}
        className="size-10 rounded-lg object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function stripHtml(html?: string | null): string {
  if (!html) return ""
  return html.replace(/<[^>]*>?/gm, "").trim()
}

export function ProductCard({ product }: ProductCardProps) {
  const isFree = Number(product.creditsPerRun ?? 0) === 0
  const cleanDescription =
    product.excerpt ??
    (stripHtml(product.description) || "No description available")

  return (
    <Link
      to="/products/$productSlug"
      params={{ productSlug: product.slug }}
      className="group block h-full outline-none"
    >
      <Card className="border-border bg-card flex h-full flex-col gap-3 rounded-xl border p-4 shadow-none transition-all duration-150 hover:border-gray-300 hover:shadow-2xs dark:hover:border-gray-700">
        <div className="flex items-start gap-3">
          <ProductAvatar name={product.name} thumbnail={product.thumbnail} />
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground group-hover:text-primary line-clamp-3 text-sm font-semibold transition-colors">
              {product.name}
            </h3>
            {product.categories && product.categories.length > 0 && (
              <span className="text-muted-foreground text-xs">
                {product.categories[0].name}
              </span>
            )}
          </div>
        </div>

        <p className="text-muted-foreground line-clamp-2 flex-1 text-xs/relaxed">
          {cleanDescription}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <span
            className={`text-xs font-medium ${
              isFree
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            }`}
          >
            {isFree ? "Free" : `${product.creditsPerRun} credits/run`}
          </span>
        </div>
      </Card>
    </Link>
  )
}
