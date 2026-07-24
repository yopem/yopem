"use client"

import { useEffect, useState } from "react"

import { serializeSlateToHtml } from "editor/serialize"
import { cn } from "ui"

interface ProductDescriptionProps {
  description: string | null
  className?: string
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/\u0026/g, "&amp;")
    .replace(/\u003c/g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const isSlateValue = (value: string): boolean => {
  if (!value.trim().startsWith("[")) return false
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
  } catch {
    return false
  }
}

const ProductDescription = ({
  description,
  className,
}: ProductDescriptionProps) => {
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false

    if (!description || description.trim().length === 0) {
      setHtml("")
      return
    }

    if (isSlateValue(description)) {
      void (async () => {
        try {
          const nodes = JSON.parse(description) as Parameters<
            typeof serializeSlateToHtml
          >[0]
          const serialized = await serializeSlateToHtml(nodes)
          if (!cancelled) setHtml(serialized)
        } catch {
          if (!cancelled) {
            setHtml(`<p>${escapeHtml(description)}</p>`)
          }
        }
      })()
    } else if (description.trim().startsWith("<")) {
      setHtml(description)
    } else {
      setHtml(`<p>${escapeHtml(description)}</p>`)
    }

    return () => {
      cancelled = true
    }
  }, [description])

  if (!html) {
    return (
      <p className={cn("text-muted-foreground", className)}>
        No description available
      </p>
    )
  }

  return (
    <div
      className={cn("product-description", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default ProductDescription
