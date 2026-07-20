"use client"

import type { ReactNode } from "react"

import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from "@platejs/selection/react"
import { KEYS } from "platejs"
import {
  useEditorPlugin,
  useEditorReadOnly,
  usePluginOption,
} from "platejs/react"

import { setBlockType } from "editor/transform"
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSub,
  ContextMenuSubPopup,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "ui/context-menu"
import { useIsTouchDevice } from "ui/hooks/use-touch-device"

export function BlockContextMenu({ children }: { children: ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin)
  const isTouch = useIsTouchDevice()
  const readOnly = useEditorReadOnly()
  const openId = usePluginOption(BlockMenuPlugin, "openId")
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID

  const handleTurnInto = (type: string) => {
    editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes()
      .forEach(([, path]) => {
        setBlockType(editor, type, { at: path })
      })
  }

  const handleAlign = (align: "center" | "left" | "right") => {
    editor
      .getTransforms(BlockSelectionPlugin)
      .blockSelection.setNodes({ align })
  }

  if (isTouch) {
    return children
  }

  return (
    <ContextMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide()
        }
      }}
    >
      <ContextMenuTrigger
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset
          const disabled =
            dataset?.slateEditor === "true" ||
            readOnly ||
            dataset?.plateOpenContextMenu === "false"

          if (disabled) return event.preventDefault()

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            })
          }, 0)
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuPopup className="w-64">
        <ContextMenuGroup>
          <ContextMenuItem
            onClick={() => {
              editor
                .getTransforms(BlockSelectionPlugin)
                .blockSelection.removeNodes()
              editor.tf.focus()
            }}
          >
            Delete
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              editor
                .getTransforms(BlockSelectionPlugin)
                .blockSelection.duplicate()
            }}
          >
            Duplicate
            {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Turn into</ContextMenuSubTrigger>
            <ContextMenuSubPopup className="w-48">
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                Paragraph
              </ContextMenuItem>

              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                Heading 1
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                Heading 2
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                Heading 3
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleTurnInto(KEYS.blockquote)}>
                Blockquote
              </ContextMenuItem>
            </ContextMenuSubPopup>
          </ContextMenuSub>
        </ContextMenuGroup>

        <ContextMenuGroup>
          <ContextMenuItem
            onClick={() =>
              editor
                .getTransforms(BlockSelectionPlugin)
                .blockSelection.setIndent(1)
            }
          >
            Indent
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() =>
              editor
                .getTransforms(BlockSelectionPlugin)
                .blockSelection.setIndent(-1)
            }
          >
            Outdent
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Align</ContextMenuSubTrigger>
            <ContextMenuSubPopup className="w-48">
              <ContextMenuItem onClick={() => handleAlign("left")}>
                Left
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign("center")}>
                Center
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleAlign("right")}>
                Right
              </ContextMenuItem>
            </ContextMenuSubPopup>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuPopup>
    </ContextMenu>
  )
}
