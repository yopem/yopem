"use client"

import type { ComponentProps } from "react"

import {
  type ResizeHandle as ResizeHandlePrimitive,
  Resizable as ResizablePrimitive,
  useResizeHandle,
  useResizeHandleState,
} from "@platejs/resizable"

import type { VariantProps } from "ui"
import { cn, cva } from "ui"

export const mediaResizeHandleVariants = cva(
  cn(
    "top-0 flex w-6 flex-col justify-center select-none",
    "after:bg-ring after:flex after:h-16 after:w-0.75 after:rounded-[6px] after:opacity-0 after:content-['_'] group-hover:after:opacity-100",
  ),
  {
    variants: {
      direction: {
        left: "-left-3 -ml-3 pl-3",
        right: "-right-3 -mr-3 items-end pr-3",
      },
    },
  },
)

const resizeHandleVariants = cva("absolute z-40", {
  variants: {
    direction: {
      bottom: "w-full cursor-row-resize",
      left: "h-full cursor-col-resize",
      right: "h-full cursor-col-resize",
      top: "w-full cursor-row-resize",
    },
  },
})

export function ResizeHandle({
  className,
  options,
  ...props
}: ComponentProps<typeof ResizeHandlePrimitive> &
  VariantProps<typeof resizeHandleVariants>) {
  const state = useResizeHandleState(options ?? {})
  const resizeHandle = useResizeHandle(state)

  if (state.readOnly) return null

  return (
    <div
      className={cn(
        resizeHandleVariants({ direction: options?.direction }),
        className,
      )}
      data-resizing={state.isResizing}
      {...resizeHandle.props}
      {...props}
    />
  )
}

const resizableVariants = cva("", {
  variants: {
    align: {
      center: "mx-auto",
      left: "mr-auto",
      right: "ml-auto",
    },
  },
})

export function Resizable({
  align,
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive> &
  VariantProps<typeof resizableVariants>) {
  return (
    <ResizablePrimitive
      {...props}
      className={cn(resizableVariants({ align }), className)}
    />
  )
}
