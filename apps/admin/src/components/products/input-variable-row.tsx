"use client"

import { PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "ui/button"
import { Card, CardPanel } from "ui/card"
import { Checkbox } from "ui/checkbox"
import { Input } from "ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"

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

export function InputVariableRow({
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
}: InputVariableRowProps) {
  const safeOptions = options ?? EMPTY_OPTIONS
  const [newOptionLabel, setNewOptionLabel] = useState("")
  const [newOptionValue, setNewOptionValue] = useState("")

  const handleAddOption = () => {
    if (!newOptionLabel.trim() || !newOptionValue.trim()) return
    onOptionsChange?.([
      ...safeOptions,
      {
        label: newOptionLabel.trim(),
        value: newOptionValue.trim(),
      },
    ])
    setNewOptionLabel("")
    setNewOptionValue("")
  }

  const handleDeleteOption = (index: number) => {
    onOptionsChange?.(safeOptions.filter((_, i) => i !== index))
  }

  const handleEditOption = (
    index: number,
    field: "label" | "value",
    value: string,
  ) => {
    onOptionsChange?.(
      safeOptions.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt,
      ),
    )
  }

  return (
    <Card className="group">
      <CardPanel className="flex flex-col gap-5">
        <div className="grid items-start gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`var-name-${variableName}`}
              className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
            >
              Variable Name
            </label>
            <Input
              nativeInput
              id={`var-name-${variableName}`}
              value={variableName || ""}
              onChange={(e) => onVariableNameChange?.(e.currentTarget.value)}
              placeholder="topic"
              className="font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Type
            </label>
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

          <div className="flex h-full items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Remove variable"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Description
          </label>
          <Input
            nativeInput
            value={description || ""}
            onChange={(e) => onDescriptionChange?.(e.currentTarget.value)}
            placeholder="What the user will enter"
            className="text-sm"
          />
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2">
          <Checkbox
            checked={isOptional}
            onCheckedChange={(checked) => onOptionalChange?.(checked === true)}
          />
          <span className="text-sm">Optional field</span>
        </label>

        {type === "select" && (
          <div className="bg-muted/50 rounded-xl border border-dashed p-4">
            <div className="text-muted-foreground mb-3 text-sm font-medium">
              Select Options
            </div>

            {safeOptions.length > 0 && (
              <div className="mb-3 space-y-2">
                {safeOptions.map((option, index) => (
                  <div
                    key={`option-${index}`}
                    className="flex items-center gap-2"
                  >
                    <Input
                      nativeInput
                      value={option.label}
                      onChange={(e) =>
                        handleEditOption(index, "label", e.currentTarget.value)
                      }
                      placeholder="Label"
                      className="flex-1 text-sm"
                    />
                    <Input
                      nativeInput
                      value={option.value}
                      onChange={(e) =>
                        handleEditOption(index, "value", e.currentTarget.value)
                      }
                      placeholder="value"
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteOption(index)}
                      aria-label="Remove option"
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                nativeInput
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
                nativeInput
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
                disabled={!newOptionLabel.trim() || !newOptionValue.trim()}
                aria-label="Add option"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>

            {safeOptions.length === 0 && (
              <p className="text-muted-foreground mt-2 text-xs italic">
                Add at least one option for this select field.
              </p>
            )}
          </div>
        )}
      </CardPanel>
    </Card>
  )
}
