"use client"

import type { PlateEditor, PlateElementProps } from "platejs/react"
import type { ReactNode } from "react"

import { insertMediaEmbed } from "@platejs/media"
import { FloatingMediaStore } from "@platejs/media/react"
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
} from "lucide-react"
import { type TComboboxInputElement, KEYS } from "platejs"
import { PlateElement } from "platejs/react"

import { FacebookIcon, TwitterIcon, YoutubeIcon } from "editor/brand-icons"
import { insertBlock, insertInlineElement } from "editor/transform"

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox"

interface Group {
  group: string
  items: {
    icon: ReactNode
    value: string
    onSelect: (editor: PlateEditor, value: string) => void
    className?: string
    focusEditor?: boolean
    keywords?: string[]
    label?: string
  }[]
}

const groups: Group[] = [
  {
    group: "Basic blocks",
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ["paragraph"],
        label: "Paragraph",
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ["title", "h1"],
        label: "Heading 1",
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ["subtitle", "h2"],
        label: "Heading 2",
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ["subtitle", "h3"],
        label: "Heading 3",
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ["unordered", "ul", "-"],
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        keywords: ["ordered", "ol", "1"],
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <QuoteIcon />,
        keywords: ["citation", "blockquote", "quote", ">"],
        label: "Blockquote",
        value: KEYS.blockquote,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true })
      },
    })),
  },
  {
    group: "Inline",
    items: [
      {
        focusEditor: true,
        icon: <LinkIcon />,
        keywords: ["url", "href", "link"],
        label: "Link",
        value: KEYS.link,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value)
      },
    })),
  },
  {
    group: "Media",
    items: [
      {
        focusEditor: true,
        icon: <YoutubeIcon />,
        keywords: ["youtube"],
        label: "YouTube",
        value: "media-embed-youtube",
      },
      {
        focusEditor: true,
        icon: <TwitterIcon />,
        keywords: ["tweet", "twitter", "x"],
        label: "Twitter",
        value: "media-embed-twitter",
      },
      {
        focusEditor: true,
        icon: <FacebookIcon />,
        keywords: ["facebook", "post"],
        label: "Facebook",
        value: "media-embed-facebook",
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor) => {
        if (!editor.selection) {
          editor.tf.focus()
        }
        FloatingMediaStore.set("url", "")
        insertMediaEmbed(editor, {}, { select: true })
        FloatingMediaStore.set("isEditing", true)
      },
    })),
  },
]

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty hideOnEmptySearch>
            No results
          </InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    {icon}
                    {label ?? value}
                  </InlineComboboxItem>
                ),
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  )
}
