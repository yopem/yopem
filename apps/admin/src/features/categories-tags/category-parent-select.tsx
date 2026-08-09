"use client"

import { Field, FieldLabel } from "ui/field"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"

import type { CategoryTreeNode } from "./category-tree"

interface CategoryParentSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  categories: CategoryTreeNode[]
  tree: { node: CategoryTreeNode; depth: number }[]
}

export function CategoryParentSelect({
  value,
  onChange,
  categories,
  tree,
}: CategoryParentSelectProps) {
  return (
    <Field>
      <FieldLabel>Parent Category</FieldLabel>
      <Select
        value={value ?? ""}
        onValueChange={(next) =>
          onChange(next && next !== "" ? next : undefined)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="No parent">
            {value
              ? (categories.find((c) => c.id === value)?.name ?? "No parent")
              : "No parent"}
          </SelectValue>
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value="">No parent</SelectItem>
          {tree.map(({ node, depth }) => (
            <SelectItem
              key={node.id}
              value={node.id}
              className="truncate"
              style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
            >
              {node.name}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Field>
  )
}
