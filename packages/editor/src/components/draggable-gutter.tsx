"use client"

import type { ComponentProps } from "react"

import { BlockSelectionPlugin } from "@platejs/selection/react"
import { getPluginByType } from "platejs"
import {
  useEditorRef,
  useElement,
  usePluginOption,
  useSelected,
} from "platejs/react"

import { cn } from "ui"

export function DraggableGutter({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  const editor = useEditorRef()
  const element = useElement()
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  )
  const selected = useSelected()

  return (
    <div
      {...props}
      className={cn(
        "slate-gutterLeft",
        "absolute top-0 z-50 flex h-full -translate-x-full cursor-text hover:opacity-100 sm:opacity-0",
        getPluginByType(editor, element.type)?.node.isContainer
          ? "group-hover/container:opacity-100"
          : "group-hover:opacity-100",
        isSelectionAreaVisible && "hidden",
        !selected && "opacity-0",
        className,
      )}
      contentEditable={false}
    >
      {children}
    </div>
  )
}
