"use client"

import { Button } from "@/components/ui/button"

export type TimeRange = "24h" | "7d"

interface TimeRangeToggleProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const TimeRangeToggle = ({ value, onChange }: TimeRangeToggleProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={value === "24h" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("24h")}
      >
        24 Hours
      </Button>
      <Button
        variant={value === "7d" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("7d")}
      >
        7 Days
      </Button>
    </div>
  )
}

export default TimeRangeToggle
