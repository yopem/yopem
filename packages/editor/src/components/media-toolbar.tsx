"use client"

import type { TImageElement } from "platejs"
import type { WithRequiredKey } from "platejs"
import type { ReactNode } from "react"

import {
  FloatingMedia as FloatingMediaPrimitive,
  FloatingMediaStore,
  useFloatingMediaValue,
  useImagePreviewValue,
} from "@platejs/media/react"
import { LinkIcon, TrashIcon } from "lucide-react"
import { KEYS } from "platejs"
import {
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
} from "platejs/react"
import { useEffect, useRef, useState } from "react"

import { Button, buttonVariants } from "ui/button"
import { Popover, PopoverContent } from "ui/popover"
import { Separator } from "ui/separator"
import { cn, cva } from "ui/utils"

import { CaptionButton } from "./caption"

const inputVariants = cva(
  "placeholder:text-muted-foreground flex h-9 w-full rounded-md border-none bg-transparent px-2 py-1.5 text-base focus-visible:ring-transparent focus-visible:outline-none md:text-sm",
)

function useFocusUrlInput(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return

    let attempts = 0
    let timeout = 0
    let cancelled = false

    function focusUrlInput() {
      if (cancelled) return
      const input = document.querySelector<HTMLInputElement>(
        "[data-media-toolbar] [data-media-focus]",
      )
      if (input) {
        if (document.activeElement !== input) {
          input.focus()
        }
        if (document.activeElement === input) return
      }
      if (attempts++ < 20) {
        timeout = window.setTimeout(focusUrlInput, 15)
      }
    }

    focusUrlInput()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [isOpen])
}

function MediaUrlInput({
  plugin,
  isNew,
}: {
  plugin: WithRequiredKey
  isNew: boolean
}) {
  useFocusUrlInput(true)
  const isImage = plugin.key === KEYS.img

  return (
    <div className="flex w-88 flex-col gap-2 p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {isNew
            ? isImage
              ? "Add image link"
              : "Add embed link"
            : isImage
              ? "Edit image link"
              : "Edit embed link"}
        </span>
      </div>

      <div className="flex items-center rounded-md border px-2">
        <div className="text-muted-foreground flex items-center pr-2">
          <LinkIcon className="size-4" />
        </div>

        <FloatingMediaPrimitive.UrlInput
          className={inputVariants()}
          placeholder={
            isImage ? "Paste the image link..." : "Paste the embed link..."
          }
          data-media-focus
          options={{ plugin }}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        {isImage
          ? "Paste an image URL, then press Enter"
          : "Paste a YouTube, Twitter/X, or Facebook link, then press Enter"}
      </p>
    </div>
  )
}

function AltInput({ onClose }: { onClose: () => void }) {
  const editor = useEditorRef()
  const element = useElement()
  const [value, setValue] = useState(
    (element as TImageElement & { alt?: string }).alt ?? "",
  )

  function commit() {
    const path = editor.api.findPath(element)
    if (path) {
      editor.tf.setNodes({ alt: value.trim() }, { at: path })
    }
    onClose()
  }

  return (
    <div className="flex w-88 flex-col gap-2 p-2">
      <span className="text-sm font-medium">Alt text</span>
      <input
        className={cn(inputVariants(), "rounded-md border")}
        placeholder="Describe the image for accessibility"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") onClose()
        }}
        autoFocus
      />
      <p className="text-muted-foreground text-xs">Press Enter to save</p>
    </div>
  )
}

export function MediaToolbar({
  children,
  plugin,
}: {
  children: ReactNode
  plugin: WithRequiredKey
}) {
  const editor = useEditorRef()
  const readOnly = useReadOnly()
  const selected = useSelected()
  const isFocusedLast = useFocusedLast()
  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    [],
  )
  const isImagePreviewOpen = useImagePreviewValue("isOpen", editor.id)
  const isEditing = useFloatingMediaValue("isEditing")
  const url = useFloatingMediaValue("url")
  const isImage = plugin.key === KEYS.img
  const [isAltEditing, setIsAltEditing] = useState(false)
  const open =
    (isFocusedLast || isAltEditing || isEditing) &&
    !readOnly &&
    selected &&
    selectionCollapsed &&
    !isImagePreviewOpen

  useEffect(() => {
    if (!open && isEditing) {
      FloatingMediaStore.set("isEditing", false)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const element = useElement()
  const { props: buttonProps } = useRemoveNodeButton({ element })
  const anchorRef = useRef<HTMLDivElement>(null)

  return (
    <Popover open={open} modal={false}>
      <div ref={anchorRef} className="relative">
        {children}
      </div>

      <PopoverContent
        align="center"
        side="top"
        anchor={anchorRef}
        className="w-auto p-0"
        initialFocus={false}
        data-media-toolbar
      >
        {isAltEditing ? (
          <AltInput onClose={() => setIsAltEditing(false)} />
        ) : isEditing ? (
          <MediaUrlInput plugin={plugin} isNew={!url} />
        ) : (
          <div className="box-content flex items-center">
            <FloatingMediaPrimitive.EditButton
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              {plugin.key === KEYS.img ? "Edit image link" : "Edit link"}
            </FloatingMediaPrimitive.EditButton>

            <CaptionButton size="sm" variant="ghost">
              Caption
            </CaptionButton>

            {isImage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAltEditing(true)}
              >
                Alt text
              </Button>
            )}

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button size="sm" variant="ghost" {...buttonProps}>
              <TrashIcon />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
