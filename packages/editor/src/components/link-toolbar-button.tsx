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

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus>
      <LinkIcon />
    </ToolbarButton>
  )
}
