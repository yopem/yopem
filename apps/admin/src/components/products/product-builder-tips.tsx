"use client"

import { LightbulbIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card"

const DISMISS_KEY = "yopem:product-builder-tips-dismissed"

interface ProductBuilderTipsProps {
  mode: "create" | "edit"
}

export function ProductBuilderTips({ mode }: ProductBuilderTipsProps) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true
    return !localStorage.getItem(DISMISS_KEY)
  })

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1")
    }
    setVisible(false)
  }

  if (!visible) return null

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
            {mode === "create"
              ? "Building your first product"
              : "Editing your product"}
          </CardTitle>
        </div>
        <CardDescription>
          {mode === "create"
            ? "Start simple: name your product, add one input variable, write a short prompt, then choose a model. You can customize everything later."
            : "Review the prompt logic and input variables, then adjust model or pricing in the configuration panel."}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
