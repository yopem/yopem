"use client"

import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react"
import { KEYS } from "platejs"
import { useEditorReadOnly } from "platejs/react"

import { ToolbarGroup, ToolbarSeparator } from "ui/toolbar"

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
          </ToolbarGroup>

          <ToolbarSeparator orientation="vertical" className="h-6" />

          <ToolbarGroup>
            <MarkToolbarButton
              nodeType={KEYS.bold}
              aria-label="Bold"
              size="icon"
              data-tooltip="Bold (⌘+B)"
            >
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.italic}
              aria-label="Italic"
              size="icon"
              data-tooltip="Italic (⌘+I)"
            >
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              aria-label="Underline"
              size="icon"
              data-tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              aria-label="Strikethrough"
              size="icon"
              data-tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}
    </>
  )
}
