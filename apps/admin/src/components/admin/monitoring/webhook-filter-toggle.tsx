"use client"

import { Button } from "@repo/ui/button"

export type EventType = "all" | "order.paid" | "order.refunded"

interface WebhookFilterToggleProps {
  value: EventType
  onChange: (value: EventType) => void
}

const OPTIONS: { value: EventType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "order.paid", label: "Order Paid" },
  { value: "order.refunded", label: "Order Refunded" },
]

const WebhookFilterToggle = ({ value, onChange }: WebhookFilterToggleProps) => {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export default WebhookFilterToggle
