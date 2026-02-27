"use client"

import { Checkbox } from "./checkbox"
import { Input } from "./input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Textarea } from "./textarea"

export interface ToolInputVariable {
  variableName: string
  description: string
  type: string
  options?: { label: string; value: string }[]
}

export interface ToolInputFieldProps {
  field: ToolInputVariable
  value: string
  error: string | undefined
  fileReaderRef: React.RefObject<FileReader | null>
  onChange: (variableName: string, newValue: string) => void
  onClearError: (variableName: string) => void
}

const ToolInputField = ({
  field,
  value,
  error,
  fileReaderRef,
  onChange,
  onClearError,
}: ToolInputFieldProps) => {
  const handleChange = (newValue: string) => {
    onChange(field.variableName, newValue)
    if (error) {
      onClearError(field.variableName)
    }
  }

  switch (field.type) {
    case "text":
      return (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.description}
        />
      )

    case "long_text":
      return (
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.description}
          rows={4}
        />
      )

    case "number":
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.description}
        />
      )

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) =>
              handleChange(checked === true ? "true" : "false")
            }
          />
          <span className="text-muted-foreground text-sm">
            {field.description || "Enable this option"}
          </span>
        </div>
      )

    case "select":
      if (!field.options || field.options.length === 0) {
        return (
          <div className="text-muted-foreground text-sm italic">
            No options available for this select field
          </div>
        )
      }
      return (
        <Select
          value={value}
          onValueChange={(newValue: string[] | string | null) => {
            if (typeof newValue === "string") {
              handleChange(newValue)
            } else if (Array.isArray(newValue) && newValue.length > 0) {
              handleChange(newValue[0] ?? "")
            }
          }}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={field.description || "Select an option"}
            />
          </SelectTrigger>
          <SelectPopup>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      )

    case "image":
      return (
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (fileReaderRef.current) {
                  fileReaderRef.current.abort()
                }
                const reader = new FileReader()
                fileReaderRef.current = reader
                reader.onload = (event) => {
                  const result = event.target?.result as string
                  handleChange(result)
                }
                reader.onerror = () => {
                  // oxlint-disable-next-line no-console
                  console.error("Failed to read image file")
                }
                reader.readAsDataURL(file)
              }
            }}
            className="text-sm"
          />
          {value && (
            <div className="text-muted-foreground text-xs">
              Image selected ({value.substring(0, 30)}...)
            </div>
          )}
        </div>
      )

    case "video":
      return (
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                if (fileReaderRef.current) {
                  fileReaderRef.current.abort()
                }
                const reader = new FileReader()
                fileReaderRef.current = reader
                reader.onload = (event) => {
                  const result = event.target?.result as string
                  handleChange(result)
                }
                reader.onerror = () => {
                  // oxlint-disable-next-line no-console
                  console.error("Failed to read video file")
                }
                reader.readAsDataURL(file)
              }
            }}
            className="text-sm"
          />
          {value && (
            <div className="text-muted-foreground text-xs">
              Video selected ({value.substring(0, 30)}...)
            </div>
          )}
        </div>
      )

    default:
      return (
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.description}
        />
      )
  }
}

export default ToolInputField
