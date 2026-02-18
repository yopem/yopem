"use client"

import { LoaderCircleIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { logger } from "@/lib/utils/logger"

interface ToolInputVariable {
  variableName: string
  description: string
  type: string
  options?: { label: string; value: string }[]
}

interface ToolPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inputVariables: ToolInputVariable[]
  onExecute: (inputs: Record<string, string>) => void
  isExecuting: boolean
  result: string | null
}

const ToolPreviewSheet = ({
  open,
  onOpenChange,
  inputVariables,
  onExecute,
  isExecuting,
  result,
}: ToolPreviewSheetProps) => {
  const [previewInputs, setPreviewInputs] = useState<Record<string, string>>({})
  const [isVisible, setIsVisible] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileReaderRef = useRef<FileReader | null>(null)

  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
    }

    if (open) {
      animationTimerRef.current = setTimeout(() => setIsVisible(true), 10)
    } else {
      animationTimerRef.current = setTimeout(() => setIsVisible(false), 10)
    }

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current)
      }
    }
  }, [open])

  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {}

    for (const variable of inputVariables) {
      const value = previewInputs[variable.variableName]

      switch (variable.type) {
        case "number":
          if (value && isNaN(Number(value))) {
            errors[variable.variableName] = "Must be a valid number"
          }
          break
        case "boolean":
          break
        case "select":
          if (
            variable.options &&
            value &&
            !variable.options.some((opt) => opt.value === value)
          ) {
            errors[variable.variableName] = "Please select a valid option"
          }
          break
        case "image":
          if (value && !value.startsWith("data:image/")) {
            errors[variable.variableName] = "Invalid image format"
          }
          break
        case "video":
          if (value && !value.startsWith("data:video/")) {
            errors[variable.variableName] = "Invalid video format"
          }
          break
        case "text":
        case "long_text":
          break
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const renderInputField = (field: ToolInputVariable) => {
    const value = previewInputs[field.variableName] || ""
    const error = validationErrors[field.variableName]

    const handleChange = (newValue: string) => {
      setPreviewInputs((prev) => ({
        ...prev,
        [field.variableName]: newValue,
      }))
      if (error) {
        setValidationErrors((prev) => {
          const next = { ...prev }
          delete next[field.variableName]
          return next
        })
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
                    logger.error("Failed to read image file")
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
                    logger.error("Failed to read video file")
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

  const handleExecutePreview = () => {
    if (!validateInputs()) {
      return
    }
    onExecute(previewInputs)
  }

  const handleClose = () => {
    setIsVisible(false)
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = setTimeout(() => onOpenChange(false), 200)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
      if (fileReaderRef.current) {
        fileReaderRef.current.abort()
      }
    }
  }, [])

  if (!open) return null

  return (
    <>
      <div
        tabIndex={0}
        className={`fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            handleClose()
          }
        }}
      />

      <div
        className={`bg-popover text-popover-foreground fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-lg transition-transform duration-200 ease-in-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="absolute top-2 right-2 z-10"
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </Button>

        <div className="flex flex-col gap-2 border-b p-6">
          <h2 className="font-heading text-xl leading-none font-semibold">
            Tool Preview
          </h2>
          <p className="text-muted-foreground text-sm">
            Preview your tool with sample inputs before deploying.
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-6">
            {inputVariables.length > 0 && (
              <div className="flex flex-col gap-4">
                {inputVariables.map((field) => (
                  <Field key={field.variableName}>
                    <FieldLabel>{field.variableName}</FieldLabel>
                    {renderInputField(field)}
                    {validationErrors[field.variableName] && (
                      <p className="text-destructive mt-1 text-xs">
                        {validationErrors[field.variableName]}
                      </p>
                    )}
                  </Field>
                ))}
              </div>
            )}

            <Button onClick={handleExecutePreview} disabled={isExecuting}>
              {isExecuting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                "Execute Preview"
              )}
            </Button>

            {result && (
              <div className="bg-muted mt-4 rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

export default ToolPreviewSheet
export { type ToolPreviewSheetProps, type ToolInputVariable }
