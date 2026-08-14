"use client"

import { CheckIcon } from "lucide-react"
import { useState } from "react"

export interface ProductSelectCardProps {
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
  selected: boolean
  onSelect: () => void
}

function stripHtml(html?: string | null): string {
  if (!html) return ""
  return html.replace(/<[^>]*>?/gm, "").trim()
}

export function ProductSelectCard({
  product,
  selected,
  onSelect,
}: ProductSelectCardProps) {
  const [imageError, setImageError] = useState(false)
  const isFree = Number(product.creditsPerRun ?? 0) === 0
  const cleanDescription =
    product.excerpt ??
    (stripHtml(product.description) || "No description available")

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
        selected
          ? "border-primary bg-primary/5 ring-primary ring-1"
          : "border-border bg-card hover:border-gray-300 hover:shadow-2xs dark:hover:border-gray-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {product.thumbnail?.url && !imageError ? (
          <img
            src={product.thumbnail.url}
            alt={`${product.name} icon`}
            width={40}
            height={40}
            className="size-10 rounded-lg object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground line-clamp-3 text-sm font-semibold">
            {product.name}
          </h3>
          {product.categories && product.categories.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {product.categories[0].name}
            </span>
          )}
        </div>
        {selected && (
          <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
            <CheckIcon className="size-3" />
          </span>
        )}
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
    </button>
  )
}
