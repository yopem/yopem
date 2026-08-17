"use client"

import { type PlateElementProps, PlateElement } from "platejs/react"

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="mb-2 border-l-2 pl-6 italic [&_p]:mb-0"
      {...props}
    />
  )
}
