"use client"

import { InfoIcon } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"

interface OutputFormatToggleProps {
  value: "plain" | "json"
  onChange: (value: "plain" | "json") => void
}

const OutputFormatToggle = ({ value, onChange }: OutputFormatToggleProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="group relative flex items-center gap-2">
        Output Format
        <div className="relative">
          <InfoIcon className="text-muted-foreground size-3.5 cursor-help" />
          <div className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-sm p-2 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            Forces the model to output valid JSON
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Toggle
          pressed={value === "plain"}
          onPressedChange={() => {
            onChange("plain")
          }}
          className="border-input bg-background data-pressed:bg-foreground data-pressed:text-background flex-1 rounded-md border"
        >
          Plain Text
        </Toggle>
        <Toggle
          pressed={value === "json"}
          onPressedChange={() => {
            onChange("json")
          }}
          className="border-input bg-background data-pressed:bg-foreground data-pressed:text-background flex-1 rounded-md border"
        >
          JSON Object
        </Toggle>
      </div>
    </div>
  )
}

export default OutputFormatToggle
