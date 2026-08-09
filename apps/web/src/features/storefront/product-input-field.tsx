"use client"

import { Checkbox } from "ui/checkbox"
import { Input } from "ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "ui/select"
import { Textarea } from "ui/textarea"

export interface ProductInputVariable {
  variableName: string
  description: string
  type: string
  options?: { label: string; value: string }[]
}

export interface ProductInputFieldProps {
  field: ProductInputVariable
  value: string
  error: string | undefined
  fileReaderRef: React.RefObject<FileReader | null>
  onChange: (variableName: string, newValue: string) => void
  onClearError: (variableName: string) => void
}

export function ProductInputField({
  field,
  value,
  error,
  fileReaderRef,
  onChange,
  onClearError,
}: ProductInputFieldProps) {
  const handleChange = (newValue: string) => {
    onChange(field.variableName, newValue)
    if (error) {
      onClearError(field.variableName)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (fileReaderRef.current) {
      fileReaderRef.current.abort()
    }
    const reader = new FileReader()
    fileReaderRef.current = reader
    reader.onload = (loadEvent) => {
      handleChange(loadEvent.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const renderFileField = (accept: string, label: string) => (
    <div className="flex flex-col gap-2">
      <Input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="text-sm"
      />
      {value && (
        <div className="text-muted-foreground text-xs">
          {label} selected ({value.substring(0, 30)}...)
        </div>
      )}
    </div>
  )

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
      return renderFileField("image/*", "Image")

    case "video":
      return renderFileField("video/*", "Video")

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
