"use client"

import type { ComponentProps } from "react"

import { useMarkToolbarButton, useMarkToolbarButtonState } from "platejs/react"

import { ToolbarButton } from "ui/toolbar"

export function MarkToolbarButton({
  clear,
  nodeType,
  ...props
}: ComponentProps<typeof ToolbarButton> & {
  nodeType: string
  clear?: string[] | string
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType })
  const { props: buttonProps } = useMarkToolbarButton(state)
  const { pressed, ...restButtonProps } = buttonProps

  return (
    <ToolbarButton
      {...props}
      {...restButtonProps}
      aria-pressed={pressed}
      data-pressed={pressed ? "" : undefined}
      data-active={pressed ? "" : undefined}
    />
  )
}
