"use client"

import { useDraggable } from "@platejs/dnd"
import { BlockSelectionPlugin } from "@platejs/selection/react"
import { type TElement, getPluginByType, isType } from "platejs"
import {
  type PlateEditor,
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
} from "platejs/react"
import { useEffect, useState } from "react"

import { cn } from "ui"

import { DragHandle } from "./drag-handle"
import { DraggableGutter } from "./draggable-gutter"
import { DropLine } from "./drop-line"

const UNDRAGGABLE_KEYS: string[] = []

export const BlockDraggable: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props

  if (editor.dom.readOnly) return

  if (path.length !== 1 || isType(editor, element, UNDRAGGABLE_KEYS)) return

  return (props) => <Draggable {...props} />
}

function Draggable(props: PlateElementProps) {
  const { children, editor, element } = props
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin).blockSelection

  const { isAboutToDrag, isDragging, nodeRef, previewRef, handleRef } =
    useDraggable({
      element,
      onDropHandler: (_, { dragItem }) => {
        const id = (dragItem as { id: string[] | string }).id

        if (blockSelectionApi) {
          blockSelectionApi.add(id)
        }
        resetPreview()
      },
    })

  const [previewTop, setPreviewTop] = useState(0)

  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren()
      previewRef.current?.classList.add("hidden")
    }
  }

  useEffect(() => {
    if (!isDragging) {
      resetPreview()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  useEffect(() => {
    if (isAboutToDrag) {
      previewRef.current?.classList.remove("opacity-0")
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isAboutToDrag])

  const [dragButtonTop, setDragButtonTop] = useState(0)

  return (
    <div
      className={cn(
        "relative",
        isDragging && "opacity-50",
        getPluginByType(editor, element.type)?.node.isContainer
          ? "group/container"
          : "group",
      )}
      onMouseEnter={() => {
        if (isDragging) return
        setDragButtonTop(calcDragButtonTop(editor, element))
      }}
    >
      <DraggableGutter>
        <div className={cn("slate-blockToolbarWrapper", "flex h-[1.5em]")}>
          <div
            className={cn(
              "slate-blockToolbar relative w-4.5",
              "pointer-events-auto mr-1 flex items-center",
            )}
          >
            <div
              className="absolute left-0 h-6 w-full p-0"
              style={{ top: `${dragButtonTop + 3}px` }}
            >
              <DragHandle
                handleRef={handleRef}
                isDragging={isDragging}
                previewRef={previewRef}
                resetPreview={resetPreview}
                setPreviewTop={setPreviewTop}
              />
            </div>
          </div>
        </div>
      </DraggableGutter>

      <div
        ref={previewRef}
        className={cn("absolute left-0 hidden w-full")}
        style={{ top: `${-previewTop}px` }}
        contentEditable={false}
      />

      <div
        ref={nodeRef}
        className="slate-blockWrapper flow-root"
        onContextMenu={(event) =>
          editor
            .getApi(BlockSelectionPlugin)
            .blockSelection.addOnContextMenu({ element, event })
        }
      >
        <MemoizedChildren>{children}</MemoizedChildren>
        <DropLine />
      </div>
    </div>
  )
}

const calcDragButtonTop = (editor: PlateEditor, element: TElement): number => {
  const child = editor.api.toDOMNode(element)!

  const currentMarginTopString = window.getComputedStyle(child).marginTop
  const currentMarginTop = Number(currentMarginTopString.replace("px", ""))

  return currentMarginTop
}
