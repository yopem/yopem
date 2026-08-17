"use client"

import type { PlateElementProps } from "platejs/react"

import { PlateElement } from "platejs/react"

import { type VariantProps, cva } from "ui/utils"

const headingVariants = cva(
  "data-[nav-target=true]:bg-highlight relative mb-2 data-[nav-target=true]:rounded-md",
  {
    variants: {
      variant: {
        h1: "pb-1 font-sans text-4xl font-bold",
        h2: "pb-px font-sans text-2xl font-semibold tracking-tight",
        h3: "pb-px font-sans text-xl font-semibold tracking-tight",
        h4: "font-sans text-lg font-semibold tracking-tight",
        h5: "text-lg font-semibold tracking-tight",
        h6: "text-base font-semibold tracking-tight",
      },
    },
  },
)

function HeadingElement({
  variant = "h1",
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {props.children}
    </PlateElement>
  )
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />
}
