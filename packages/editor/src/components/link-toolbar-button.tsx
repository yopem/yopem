"use client"

import type { ComponentProps } from "react"

import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from "@platejs/link/react"
import { IconLink } from "@tabler/icons-react"

import { ToolbarButton } from "ui/toolbar"

export function LinkToolbarButton(props: ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState()
  const { props: buttonProps } = useLinkToolbarButton(state)

  return (
    <ToolbarButton {...props} {...buttonProps} data-plate-focus>
      <IconLink />
    </ToolbarButton>
  )
}
