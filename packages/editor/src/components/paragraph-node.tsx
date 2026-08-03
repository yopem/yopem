"use client"

import type { PlateElementProps } from "platejs/react"

import { PlateElement } from "platejs/react"

import { cn } from "ui/utils"

export function ParagraphElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className={cn("mb-2")}>
      {props.children}
    </PlateElement>
  )
}
