"use client"

import {
  BulletedListRules,
  isOrderedList,
  OrderedListRules,
} from "@platejs/list"
import { ListPlugin } from "@platejs/list/react"
import { KEYS } from "platejs"

import { BlockList } from "editor/block-list"
import { IndentKit } from "editor/indent-kit"

export const ListKit = [
  ...IndentKit,
  ListPlugin.configure({
    inputRules: [
      BulletedListRules.markdown({ variant: "-" }),
      BulletedListRules.markdown({ variant: "*" }),
      OrderedListRules.markdown({ variant: "." }),
      OrderedListRules.markdown({ variant: ")" }),
    ],
    inject: {
      nodeProps: {
        nodeKey: KEYS.listType,
        query: ({ nodeProps }) => {
          const element = nodeProps.element

          return !!element?.listStyleType && !isOrderedList(element)
        },
        transformProps: ({ props }) => ({
          ...props,
          role: "listitem",
          style: {
            // oxlint-disable-next-line typescript/no-misused-spread -- props.style is a plain object, not iterable
            ...props.style,
            display: "list-item",
          },
        }),
      },
      targetPlugins: [
        ...KEYS.heading,
        KEYS.p,
        KEYS.blockquote,
        KEYS.toggle,
        KEYS.img,
      ],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
]
