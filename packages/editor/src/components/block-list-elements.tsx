"use client"

import type { TListElement } from "platejs"
import type { FC, ReactNode } from "react"

import { isOrderedList } from "@platejs/list"
import {
  useTodoListElement,
  useTodoListElementState,
} from "@platejs/list/react"
import { type PlateElementProps, useReadOnly } from "platejs/react"

import { cn } from "ui"
import { Checkbox } from "ui/checkbox"

const config: Record<
  string,
  {
    Li: FC<PlateElementProps & { lineBreakBadge?: ReactNode }>
    Marker: FC<PlateElementProps>
  }
> = {
  todo: {
    Li: TodoLi,
    Marker: TodoMarker,
  },
}

export function IconList(
  props: PlateElementProps & { lineBreakBadge?: ReactNode },
) {
  const { listStart, listStyleType } = props.element as TListElement
  const { Li, Marker } = config[listStyleType] ?? {}
  const IconList = isOrderedList(props.element) ? "ol" : "ul"

  return (
    <IconList
      className="relative m-0 p-0"
      style={{ listStyleType }}
      start={listStart}
    >
      {Marker && <Marker {...props} />}
      {Li ? (
        <Li {...props} />
      ) : (
        <li>
          {props.children}
          {props.lineBreakBadge}
        </li>
      )}
    </IconList>
  )
}

function TodoMarker(props: PlateElementProps) {
  const state = useTodoListElementState({ element: props.element })
  const { checkboxProps } = useTodoListElement(state)
  const readOnly = useReadOnly()

  return (
    <div contentEditable={false}>
      <Checkbox
        className={cn(
          "absolute top-1 -left-6",
          readOnly && "pointer-events-none",
        )}
        {...checkboxProps}
      />
    </div>
  )
}

function TodoLi(props: PlateElementProps & { lineBreakBadge?: ReactNode }) {
  return (
    <li
      className={cn(
        "list-none",
        (props.element.checked as boolean) &&
          "text-muted-foreground line-through",
      )}
    >
      {props.children}
      {props.lineBreakBadge}
    </li>
  )
}
