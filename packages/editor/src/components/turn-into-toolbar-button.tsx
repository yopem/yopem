import type { TElement } from "platejs"
import type { ComponentProps } from "react"

import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
} from "lucide-react"
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
    icon: <PilcrowIcon />,
    keywords: ["paragraph"],
    label: "Paragraph",
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ["title", "h1"],
    label: "Heading 1",
    value: "h1",
  },
  {
    icon: <Heading2Icon />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    value: "h2",
  },
  {
    icon: <Heading3Icon />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    value: "h3",
  },
  {
    icon: <Heading4Icon />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    value: "h4",
  },
  {
    icon: <Heading5Icon />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    value: "h5",
  },
  {
    icon: <Heading6Icon />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    value: "h6",
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
