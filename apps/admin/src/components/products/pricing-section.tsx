"use client"

import { Label } from "ui/label"

interface PricingSectionProps {
  costPerRun: number
  markup: number
  onCostPerRunChange: (value: number) => void
  onMarkupChange: (value: number) => void
}

export function PricingSection({
  costPerRun,
  markup,
  onCostPerRunChange,
  onMarkupChange,
}: PricingSectionProps) {
  const markupPercentage = Math.round(markup * 100)

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cost-per-run">Cost per run</Label>
        <div className="border-input bg-background flex items-center gap-2 rounded-lg border px-3 py-2">
          <span className="text-muted-foreground text-sm">$</span>
          <input
            id="cost-per-run"
            type="number"
            min={0}
            step={0.01}
            value={costPerRun}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (value >= 0) {
                onCostPerRunChange(value)
              }
            }}
            className="w-full bg-transparent text-right text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="markup">Markup</Label>
        <div className="border-input bg-background flex items-center gap-2 rounded-lg border px-3 py-2">
          <input
            id="markup"
            type="number"
            min={0}
            max={100}
            step={1}
            value={markupPercentage}
            onChange={(e) => {
              const percentage = Number(e.target.value)
              if (percentage >= 0 && percentage <= 100) {
                onMarkupChange(percentage / 100)
              }
            }}
            className="w-full bg-transparent text-right text-sm outline-none"
          />
          <span className="text-muted-foreground text-sm">%</span>
        </div>
      </div>
    </div>
  )
}
