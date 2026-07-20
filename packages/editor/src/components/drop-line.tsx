"use client"

import type { ComponentProps } from "react"

import { useDropLine } from "@platejs/dnd"

import { cn } from "ui"

export function DropLine({ className, ...props }: ComponentProps<"div">) {
  const { dropLine } = useDropLine()

  if (!dropLine) return null

  return (
    <div
      {...props}
      className={cn(
        "slate-dropLine",
        "pointer-events-none absolute inset-x-0 h-0.5 opacity-100 transition-opacity",
        "bg-brand/50",
        "z-50",
        dropLine === "top" && "-top-px",
        dropLine === "bottom" && "-bottom-px",
        className,
      )}
      contentEditable={false}
    />
  )
}
