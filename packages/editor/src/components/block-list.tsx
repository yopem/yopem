"use client"

import { isOrderedList } from "@platejs/list"
import { type RenderNodeWrapper } from "platejs/react"

import { IconList } from "./block-list-elements"

export function BlockList(
  props: Parameters<RenderNodeWrapper>[0],
): ReturnType<RenderNodeWrapper> {
  if (!props.element.listStyleType) return
  if (!isOrderedList(props.element)) return

  return (props) => <IconList {...props} />
}
