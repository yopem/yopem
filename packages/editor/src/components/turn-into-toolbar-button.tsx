import type { TElement } from "platejs"
import type { ComponentProps } from "react"

import {
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconH5,
  IconH6,
  IconList,
  IconListNumbers,
  IconPilcrow,
  IconQuote,
} from "@tabler/icons-react"
import { KEYS } from "platejs"
import { useEditorRef, useSelectionFragmentProp } from "platejs/react"
import { useState } from "react"

import { getBlockType, setBlockType } from "editor/transform"
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "ui/menu"
import { ToolbarButton } from "ui/toolbar"

export const turnIntoItems = [
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
    value: "h1",
  },
  {
    icon: <IconH2 />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    value: "h2",
  },
  {
    icon: <IconH3 />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    value: "h3",
  },
  {
    icon: <IconH4 />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    value: "h4",
  },
  {
    icon: <IconH5 />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    value: "h5",
  },
  {
    icon: <IconH6 />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    value: "h6",
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
    keywords: ["citation", "blockquote", ">"],
    label: "Quote",
    value: KEYS.blockquote,
  },
]

export function TurnIntoToolbarButton(props: ComponentProps<typeof Menu>) {
  const editor = useEditorRef()
  const [open, setOpen] = useState(false)

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  })
  const selectedItem =
    turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
    turnIntoItems[0]

  return (
    <Menu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <MenuTrigger
        render={
          <ToolbarButton
            className="min-w-40"
            data-pressed={open}
            data-tooltip="Turn into"
            data-is-dropdown
          />
        }
      >
        {selectedItem.label}
      </MenuTrigger>

      <MenuPopup
        className="ignore-click-outside/toolbar min-w-0"
        finalFocus={false}
        align="start"
      >
        <MenuRadioGroup
          value={value ?? KEYS.p}
          onValueChange={(type: string) => {
            setBlockType(editor, type)
          }}
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <MenuRadioItem
              key={itemValue}
              className="flex min-w-64 items-center gap-2 pl-2 *:first:[span]:hidden"
              value={itemValue}
            >
              {icon}
              {label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  )
}
