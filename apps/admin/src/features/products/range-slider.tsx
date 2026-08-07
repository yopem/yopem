"use client"

import { useId } from "react"

import { Slider } from "ui/slider"

interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

const defaultFormatValue = (v: number) => v.toString()

export function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: RangeSliderProps) {
  const format = formatValue ?? defaultFormatValue
  const sliderId = useId()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor={sliderId} className="text-sm font-medium">
          {label}
        </label>
        <span className="bg-muted rounded-sm px-1.5 py-0.5 font-mono text-xs">
          {format(value)}
        </span>
      </div>
      <Slider
        id={sliderId}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => {
          const val = Array.isArray(vals) ? vals[0] : vals
          onChange(val)
        }}
      />
    </div>
  )
}
