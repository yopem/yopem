"use client"

import { createPlatePlugin } from "platejs/react"

import { FloatingToolbar } from "editor/floating-toolbar"
import { FloatingToolbarButtons } from "editor/floating-toolbar-buttons"

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: "floating-toolbar",
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]
