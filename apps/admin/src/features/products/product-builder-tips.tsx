"use client"

import { LightbulbIcon, XIcon } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Button } from "ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card"

import type { ProductFormStep } from "./product-form-tabs"

const DISMISS_KEY = "yopem:product-builder-tips-dismissed"

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function emitChange() {
  for (const cb of listeners) cb()
}

function handleDismiss() {
  localStorage.setItem(DISMISS_KEY, "1")
  emitChange()
}

interface ProductBuilderTipsProps {
  mode: "create" | "edit"
  step: ProductFormStep
}

const stepTips: Record<
  ProductFormStep,
  { title: string; description: string }
> = {
  basics: {
    title: "Start with the basics",
    description:
      "Give your product a clear name and description, then organize it with categories, tags, and a thumbnail.",
  },
  workflow: {
    title: "Build the workflow",
    description:
      "Add Input, AI, Output, Condition, and Loop nodes. Connect them to define how user inputs turn into results.",
  },
  configure: {
    title: "Choose API key, output, and pricing",
    description:
      "Pick the default API key, set the output format, and adjust usage pricing.",
  },
}

export function ProductBuilderTips({ mode, step }: ProductBuilderTipsProps) {
  const visible = useSyncExternalStore(
    subscribe,
    () => !localStorage.getItem(DISMISS_KEY),
    () => true,
  )

  if (!visible) return null

  const tip = stepTips[step]

  return (
    <Card className="border-dashed">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDismiss}
          className="absolute top-3 right-3"
          aria-label="Dismiss tips"
        >
          <XIcon className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <LightbulbIcon className="text-warning size-4" />
          <CardTitle className="text-base">
            {mode === "create" ? tip.title : `Editing — ${tip.title}`}
          </CardTitle>
        </div>
        <CardDescription>{tip.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
