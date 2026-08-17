"use client"

import type * as React from "react"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"

import { cn, cva, type VariantProps } from "ui/utils"

export function Toolbar({
  className,
  ...props
}: ToolbarPrimitive.Root.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Root
      className={cn(
        "bg-card text-card-foreground relative flex items-center gap-1 rounded-xl border p-1 not-dark:bg-clip-padding",
        className,
      )}
      data-slot="toolbar"
      {...props}
    />
  )
}

const toolbarButtonVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-accent hover:text-accent-foreground data-pressed:bg-primary data-pressed:text-primary-foreground relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "icon",
    },
    variants: {
      size: {
        default: "h-8 px-2",
        icon: "size-8",
      },
    },
  },
)

export function ToolbarButton({
  className,
  size,
  ...props
}: ToolbarPrimitive.Button.Props &
  VariantProps<typeof toolbarButtonVariants>): React.ReactElement {
  return (
    <ToolbarPrimitive.Button
      className={cn(toolbarButtonVariants({ size }), className)}
      data-slot="toolbar-button"
      {...props}
    />
  )
}

export function ToolbarLink({
  className,
  ...props
}: ToolbarPrimitive.Link.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Link
      className={cn(className)}
      data-slot="toolbar-link"
      {...props}
    />
  )
}

export function ToolbarInput({
  className,
  ...props
}: ToolbarPrimitive.Input.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Input
      className={cn(className)}
      data-slot="toolbar-input"
      {...props}
    />
  )
}

export function ToolbarGroup({
  className,
  ...props
}: ToolbarPrimitive.Group.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Group
      className={cn("flex items-center gap-1", className)}
      data-slot="toolbar-group"
      {...props}
    />
  )
}

export function ToolbarSeparator({
  className,
  ...props
}: ToolbarPrimitive.Separator.Props): React.ReactElement {
  return (
    <ToolbarPrimitive.Separator
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:my-0.5 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:my-1.5 data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="toolbar-separator"
      {...props}
    />
  )
}

export { ToolbarPrimitive }
