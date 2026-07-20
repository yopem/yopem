"use client"

import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react"
import { KEYS } from "platejs"
import { useEditorReadOnly } from "platejs/react"

import { ToolbarGroup } from "ui/toolbar"

import { LinkToolbarButton } from "./link-toolbar-button"
import { MarkToolbarButton } from "./mark-toolbar-button"
import { TurnIntoToolbarButton } from "./turn-into-toolbar-button"

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} data-tooltip="Bold (⌘+B)">
              <IconBold />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.italic}
              data-tooltip="Italic (⌘+I)"
            >
              <IconItalic />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              data-tooltip="Underline (⌘+U)"
            >
              <IconUnderline />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              data-tooltip="Strikethrough (⌘+⇧+M)"
            >
              <IconStrikethrough />
            </MarkToolbarButton>

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}
    </>
  )
}
