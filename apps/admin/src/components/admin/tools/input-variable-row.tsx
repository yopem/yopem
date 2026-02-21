"use client"

import { Button } from "@repo/ui/button"
import { Checkbox } from "@repo/ui/checkbox"
import { Input } from "@repo/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { useState } from "react"

export type InputFieldType =
  | "text"
  | "long_text"
  | "number"
  | "boolean"
  | "select"
  | "image"
  | "video"

export interface SelectOption {
  label: string
  value: string
}

interface InputVariableRowProps {
  variableName: string
  type: InputFieldType
  description: string
  options?: SelectOption[]
  isOptional?: boolean
  onVariableNameChange?: (value: string) => void
  onTypeChange?: (value: InputFieldType) => void
  onDescriptionChange?: (value: string) => void
  onOptionsChange?: (options: SelectOption[]) => void
  onOptionalChange?: (isOptional: boolean) => void
  onDelete?: () => void
}

const typeLabels: Record<InputFieldType, string> = {
  text: "Text",
  long_text: "Long Text",
  number: "Number",
  boolean: "Boolean",
  select: "Select",
  image: "Image",
  video: "Video",
}

const EMPTY_OPTIONS: SelectOption[] = []

const InputVariableRow = ({
  variableName,
  type,
  description,
  options,
  isOptional = false,
  onVariableNameChange,
  onTypeChange,
  onDescriptionChange,
  onOptionsChange,
  onOptionalChange,
  onDelete,
}: InputVariableRowProps) => {
  const safeOptions = options ?? EMPTY_OPTIONS
  const [newOptionLabel, setNewOptionLabel] = useState("")
  const [newOptionValue, setNewOptionValue] = useState("")

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !newOptionValue.trim()) return

    const newOption: SelectOption = {
      label: newOptionLabel.trim(),
      value: newOptionValue.trim(),
    }

    onOptionsChange?.([...safeOptions, newOption])
    setNewOptionLabel("")
    setNewOptionValue("")
  }

  const handleDeleteOption = (index: number) => {
    const updatedOptions = safeOptions.filter((_, i) => i !== index)
    onOptionsChange?.(updatedOptions)
  }

  const handleEditOption = (
    index: number,
    field: "label" | "value",
    value: string,
  ) => {
    const updatedOptions = safeOptions.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt,
    )
    onOptionsChange?.(updatedOptions)
  }

  return (
    <div className="group hover:bg-muted/50 border-b p-4 transition-colors">
      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-3">
          <Input
            nativeInput={true}
            value={variableName || ""}
            onChange={(e) => {
              const value = e.currentTarget.value
              onVariableNameChange?.(value)
            }}
            placeholder="variable_name"
            className={`font-mono text-sm ${isOptional ? "opacity-60" : ""}`}
          />
        </div>
        <div className="col-span-2">
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
        <div className="col-span-3">
          <Input
            nativeInput={true}
            value={description || ""}
            onChange={(e) => {
              const value = e.currentTarget.value
              onDescriptionChange?.(value)
            }}
            placeholder="Field description"
            className={`text-sm ${isOptional ? "opacity-60" : ""}`}
          />
        </div>
        <div className="col-span-3 flex items-center gap-2">
          <Checkbox
            checked={isOptional}
            onCheckedChange={(checked) => onOptionalChange?.(checked === true)}
          />
          <span className="text-muted-foreground text-xs">Optional</span>
        </div>
        <div className="col-span-1 flex justify-end">
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm p-1 transition-colors"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>

      {/* Select Options Manager */}
      {type === "select" && (
        <div className="mt-4 space-y-3 rounded-md border border-dashed p-4">
          <div className="text-muted-foreground text-sm font-medium">
            Select Options
          </div>

          {/* Existing Options */}
          {safeOptions.length > 0 && (
            <div className="space-y-2">
              {safeOptions.map((option, index) => (
                <div
                  key={option.value || `option-${index}`}
                  className="flex items-center gap-2"
                >
                  <Input
                    nativeInput={true}
                    value={option.label}
                    onChange={(e) =>
                      handleEditOption(index, "label", e.currentTarget.value)
                    }
                    placeholder="Label"
                    className="flex-1 text-sm"
                  />
                  <Input
                    nativeInput={true}
                    value={option.value}
                    onChange={(e) =>
                      handleEditOption(index, "value", e.currentTarget.value)
                    }
                    placeholder="Value"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteOption(index)}
                    className="size-8 shrink-0"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Option */}
          <div className="flex items-center gap-2">
            <Input
              nativeInput={true}
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.currentTarget.value)}
              placeholder="New option label"
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />
            <Input
              nativeInput={true}
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.currentTarget.value)}
              placeholder="value"
              className="flex-1 font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddOption}
              className="size-8 shrink-0"
              disabled={!newOptionLabel.trim() || !newOptionValue.trim()}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>

          {safeOptions.length === 0 && (
            <p className="text-muted-foreground text-xs italic">
              No options added yet. Add at least one option for this select
              field.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default InputVariableRow
