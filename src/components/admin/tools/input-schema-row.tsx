"use client"

import { Trash2 as Trash2Icon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  onVariableNameChange?: (value: string) => void
  onTypeChange?: (value: InputFieldType) => void
  onDescriptionChange?: (value: string) => void
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
  onVariableNameChange,
  onTypeChange,
  onDescriptionChange,
  onDelete,
}: InputSchemaRowProps) => {
  return (
    <div className="group hover:bg-muted/50 grid grid-cols-12 items-center gap-4 border-b p-4 transition-colors">
      <div className="col-span-4">
        <Input
          value={variableName}
          onChange={(e) => {
            const value = e.currentTarget.value
            onVariableNameChange?.(value)
          }}
          placeholder="variable_name"
          className="font-mono text-sm"
        />
      </div>
      <div className="col-span-3">
        <Select
          value={type}
          onValueChange={(value: string[] | string | null) => {
            if (value && typeof value === "string") {
              onTypeChange?.(value as InputFieldType)
            } else if (Array.isArray(value) && value.length > 0) {
              onTypeChange?.(value[0] as InputFieldType)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>
      <div className="col-span-4">
        <Input
          value={description}
          onChange={(e) => {
            const value = e.currentTarget.value
            onDescriptionChange?.(value)
          }}
          placeholder="Field description"
          className="text-sm"
        />
      </div>
      <div className="col-span-1 flex justify-end">
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
