"use client"

interface PricingSectionProps {
  costPerRun: number
  markup: number
  onCostPerRunChange: (value: number) => void
  onMarkupChange: (value: number) => void
}

const PricingSection = ({
  costPerRun,
  markup,
  onCostPerRunChange,
  onMarkupChange,
}: PricingSectionProps) => {
  const markupPercentage = Math.round(markup * 100)

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-medium">Usage Pricing</span>
      <div className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Cost per run
          </span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              value={costPerRun}
              onChange={(e) => {
                const newValue = Number(e.target.value)
                onCostPerRunChange(newValue)
              }}
              className="border-input focus:border-foreground w-16 border-b bg-transparent p-0 text-right font-mono text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            Markup
          </span>
          <div className="flex items-center gap-1">
            <input
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
              className="border-input focus:border-foreground w-12 border-b bg-transparent p-0 text-right font-mono text-sm focus:outline-none"
            />
            <span className="text-muted-foreground font-mono text-xs">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingSection
