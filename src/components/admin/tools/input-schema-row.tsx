"use client"

import { Trash2 as Trash2Icon } from "lucide-react"

export type InputFieldType =
  | "text"
  | "select"
  | "number"
  | "boolean"
  | "textarea"

interface InputSchemaRowProps {
  variableName: string
  type: InputFieldType
  description: string
  onDelete?: () => void
}

const typeLabels: Record<InputFieldType, string> = {
  text: "Text String",
  select: "Select Option",
  number: "Number",
  boolean: "Boolean",
  textarea: "Long Text",
}

const InputSchemaRow = ({
  variableName,
  type,
  description,
  onDelete,
}: InputSchemaRowProps) => {
  return (
    <div className="group hover:bg-muted/50 grid grid-cols-12 items-center gap-4 border-b p-4 transition-colors">
      <div className="col-span-4">
        <span className="bg-muted rounded border px-2 py-1 font-mono text-sm">
          {variableName}
        </span>
      </div>
      <div className="col-span-3">
        <span className="bg-muted inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
          {typeLabels[type]}
        </span>
      </div>
      <div className="text-muted-foreground col-span-4 text-sm">
        {description}
      </div>
      <div className="col-span-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default InputSchemaRow
