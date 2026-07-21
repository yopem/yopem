"use client"

import type { ComponentProps } from "react"

import {
  type FloatingToolbarState,
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@platejs/floating"
import { useComposedRef } from "@udecode/cn"
import { KEYS } from "platejs"
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from "platejs/react"

import { cn } from "ui"
import { Toolbar } from "ui/toolbar"

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState
}) {
  const editorId = useEditorId()
  const focusedEditorId = useEventEditorValue("focus")
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, "mode")

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: [
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
          ],
          padding: 12,
        }),
      ],
      placement: "top",
      ...state?.floatingOptions,
    },
  })

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState)

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef)

  if (hidden) return null

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          "scrollbar-hide bg-popover absolute z-50 overflow-x-auto rounded-lg border p-1 whitespace-nowrap opacity-100 shadow-lg/5 print:hidden",
          "max-w-[80vw]",
          className,
        )}
      >
        {children}
      </Toolbar>
    </div>
  )
}
