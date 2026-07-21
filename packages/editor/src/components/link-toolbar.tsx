"use client"

import type { TLinkElement } from "platejs"

import { type UseVirtualFloatingOptions, flip, offset } from "@platejs/floating"
import { getLinkAttributes } from "@platejs/link"
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from "@platejs/link/react"
import {
  ExternalLinkIcon,
  Link2OffIcon,
  LinkIcon,
  ALargeSmallIcon,
} from "lucide-react"
import { KEYS } from "platejs"
import { useEditorRef, useFormInputProps, usePluginOption } from "platejs/react"

import { cva } from "ui"
import { buttonVariants } from "ui/button"
import { Separator } from "ui/separator"

const popoverVariants = cva(
  "bg-popover text-popover-foreground z-50 w-auto rounded-lg border p-1 shadow-lg/5 outline-hidden",
)

const inputVariants = cva(
  "placeholder:text-muted-foreground flex h-7 w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base focus-visible:ring-transparent focus-visible:outline-none md:text-sm",
)

export function LinkFloatingToolbar({
  state,
}: {
  state?: LinkFloatingToolbarState
}) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, "activeId")
  const activeSuggestionId = usePluginOption(
    { key: KEYS.suggestion },
    "activeId",
  )

  const floatingOptions: UseVirtualFloatingOptions = {
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ["bottom-end", "top-start", "top-end"],
        padding: 12,
      }),
    ],
    placement:
      activeSuggestionId || activeCommentId ? "top-start" : "bottom-start",
  }

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  })
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState)

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  })
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState)
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  })

  if (hidden) return null

  const input = (
    <div className="flex w-82.5 flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">
          <LinkIcon className="size-4" />
        </div>

        <FloatingLinkUrlInput
          className={inputVariants()}
          placeholder="Paste link"
          data-plate-focus
        />
      </div>
      <Separator className="my-1" />
      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">
          <ALargeSmallIcon className="size-4" />
        </div>
        <input
          className={inputVariants()}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
        />
      </div>
    </div>
  )

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center">
      <button
        className={buttonVariants({ size: "sm", variant: "ghost" })}
        type="button"
        {...editButtonProps}
      >
        Edit link
      </button>

      <Separator orientation="vertical" />

      <LinkOpenButton />

      <Separator orientation="vertical" />

      <button
        className={buttonVariants({
          size: "sm",
          variant: "ghost",
        })}
        type="button"
        {...unlinkButtonProps}
      >
        <Link2OffIcon className="size-4" />
      </button>
    </div>
  )

  return (
    <>
      <div ref={insertRef} className={popoverVariants()} {...insertProps}>
        {input}
      </div>

      <div ref={editRef} className={popoverVariants()} {...editProps}>
        {editContent}
      </div>
    </>
  )
}

function LinkOpenButton() {
  const editor = useEditorRef()

  const attributes = (() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    })
    if (!entry) {
      return {}
    }
    const [element] = entry
    return getLinkAttributes(editor, element)
  })()

  return (
    <a
      {...attributes}
      className={buttonVariants({
        size: "sm",
        variant: "ghost",
      })}
      onMouseOver={(e) => {
        e.stopPropagation()
      }}
      onFocus={(e) => {
        e.stopPropagation()
      }}
      aria-label="Open link in a new tab"
      target="_blank"
    >
      <ExternalLinkIcon className="size-4" />
    </a>
  )
}
