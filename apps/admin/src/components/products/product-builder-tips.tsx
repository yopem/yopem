"use client"

import { LightbulbIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "ui/card"

import type { ProductFormStep } from "./product-form-tabs"

const DISMISS_KEY = "yopem:product-builder-tips-dismissed"

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
      "Give your product a clear name and a short description. The description is what users read before trying it.",
  },
  inputs: {
    title: "Add user inputs",
    description:
      "Define the fields users fill out. Start simple with one variable like topic or style — you can add more later.",
  },
  prompt: {
    title: "Write the prompt",
    description:
      "Set the AI persona in System Role, then write the main instruction. Click variable chips to insert values.",
  },
  configure: {
    title: "Choose model and pricing",
    description:
      "Pick the API key and model, set the output format, and adjust pricing. Categories and tags are optional.",
  },
}

export function ProductBuilderTips({ mode, step }: ProductBuilderTipsProps) {
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
