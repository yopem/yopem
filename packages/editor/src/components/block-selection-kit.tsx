"use client"

import type { PlateElementProps } from "platejs/react"

import { BlockSelectionPlugin } from "@platejs/selection/react"
import { getPluginTypes } from "platejs"

import { BlockSelection } from "editor/block-selection"

export const hasSelectableClass = ({
  attributes,
  className,
}: {
  attributes: { className?: string }
  className?: string
}) =>
  [className, attributes.className]
    .filter(Boolean)
    .join(" ")
    .includes("slate-selectable")

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element) =>
        !getPluginTypes(editor, []).includes(element.type),
    },
    render: {
      belowRootNodes: (props) => {
        if (!hasSelectableClass(props)) return null

        return <BlockSelection {...(props as unknown as PlateElementProps)} />
      },
    },
  })),
]
