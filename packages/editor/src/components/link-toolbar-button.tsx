"use client"

import type { ComponentProps } from "react"

import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from "@platejs/link/react"
import { LinkIcon } from "lucide-react"

import { ToolbarButton } from "ui/toolbar"

export function LinkToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState()
  const { props: buttonProps } = useLinkToolbarButton(state)
  const { pressed, ...restButtonProps } = buttonProps

  return (
    <ToolbarButton
      {...props}
      {...restButtonProps}
      aria-label="Link"
      aria-pressed={pressed}
      data-pressed={pressed ? "" : undefined}
      data-active={pressed ? "" : undefined}
      size="icon"
      data-plate-focus
    >
      <LinkIcon />
    </ToolbarButton>
  )
}
