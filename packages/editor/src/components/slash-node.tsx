"use client"

import type { PlateEditor, PlateElementProps } from "platejs/react"
import type { ReactNode } from "react"

import {
  IconH1,
  IconH2,
  IconH3,
  IconLink,
  IconList,
  IconListNumbers,
  IconPilcrow,
  IconQuote,
} from "@tabler/icons-react"
import { type TComboboxInputElement, KEYS } from "platejs"
import { PlateElement } from "platejs/react"

import { insertBlock, insertInlineElement } from "editor/transform"

// import { InlineImageMenuItem } from "./image-menu-item"
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
        icon: <IconPilcrow />,
        keywords: ["paragraph"],
        label: "Paragraph",
        value: KEYS.p,
      },
      {
        icon: <IconH1 />,
        keywords: ["title", "h1"],
        label: "Heading 1",
        value: KEYS.h1,
      },
      {
        icon: <IconH2 />,
        keywords: ["subtitle", "h2"],
        label: "Heading 2",
        value: KEYS.h2,
      },
      {
        icon: <IconH3 />,
        keywords: ["subtitle", "h3"],
        label: "Heading 3",
        value: KEYS.h3,
      },
      {
        icon: <IconList />,
        keywords: ["unordered", "ul", "-"],
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <IconListNumbers />,
        keywords: ["ordered", "ol", "1"],
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <IconQuote />,
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
        icon: <IconLink />,
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
                    <div className="text-muted-foreground mr-2">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                ),
              )}
            </InlineComboboxGroup>
          ))}
          {/*
              <InlineComboboxGroup>
            <InlineComboboxGroupLabel>Media</InlineComboboxGroupLabel>
            <InlineImageMenuItem />
          </InlineComboboxGroup>
          */}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  )
}
