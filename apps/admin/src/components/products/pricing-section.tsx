"use client"

import { Label } from "ui/label"

interface PricingSectionProps {
  creditsPerRun: number
  onCreditsPerRunChange: (value: number) => void
}

export function PricingSection({
  creditsPerRun,
  onCreditsPerRunChange,
}: PricingSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="credits-per-run">Credits consumed per run</Label>
      <div className="border-input bg-background flex items-center gap-2 rounded-lg border px-3 py-2">
        <input
          id="credits-per-run"
          type="number"
          min={0}
          step={1}
          value={creditsPerRun}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (value >= 0) {
              onCreditsPerRunChange(Math.floor(value))
            }
          }}
          className="w-full bg-transparent text-right text-sm outline-none"
        />
        <span className="text-muted-foreground text-sm">credits</span>
      </div>
      <p className="text-muted-foreground text-xs">
        How many credits a user is charged each time this product runs.
      </p>
    </div>
  )
}
