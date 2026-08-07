"use client"

import type { PlateEditor, PlateElementProps } from "platejs/react"
import type { ReactNode } from "react"

import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
} from "lucide-react"
import { type TComboboxInputElement, KEYS } from "platejs"
import { PlateElement } from "platejs/react"

import { ImagePickerPlugin } from "editor/image-picker-kit"
import {
  insertBlock,
  insertImageAsset,
  insertInlineElement,
} from "editor/transform"

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

const basicBlocksGroup: Group = {
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
}

function inlineGroup(includeImage: boolean): Group {
  const items: Group["items"] = [
    {
      focusEditor: true,
      icon: <LinkIcon />,
      keywords: ["url", "href", "link"],
      label: "Link",
      value: KEYS.link,
      onSelect: (editor: PlateEditor, _value: string) => {
        insertInlineElement(editor, KEYS.link)
      },
    },
    {
      focusEditor: true,
      icon: <CodeIcon />,
      keywords: [
        "youtube",
        "twitter",
        "tweet",
        "x",
        "facebook",
        "post",
        "video",
        "embed",
      ],
      label: "Embed",
      value: KEYS.mediaEmbed,
      onSelect: (editor: PlateEditor, _value: string) => {
        insertInlineElement(editor, KEYS.mediaEmbed)
      },
    },
  ]

  if (includeImage) {
    items.push({
      focusEditor: false,
      icon: <ImageIcon />,
      keywords: ["image", "img", "picture"],
      label: "Image",
      value: "imageAsset",
      onSelect: (editor: PlateEditor, _value: string) => {
        void insertImageAsset(editor)
      },
    })
  }

  return {
    group: "Inline",
    items,
  }
}

export function createSlashGroups(includeImage: boolean): Group[] {
  return [basicBlocksGroup, inlineGroup(includeImage)]
}

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props
  const plugin = (
    editor.plugins as unknown as Record<
      string,
      { options?: { imagePicker?: () => Promise<string | undefined> } }
    >
  )[ImagePickerPlugin.key]
  const includeImage = typeof plugin?.options?.imagePicker === "function"

  const groups = createSlashGroups(includeImage)

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
