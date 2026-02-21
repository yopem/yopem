"use client"

import { Button } from "@repo/ui/button"
import { Field, FieldLabel } from "@repo/ui/field"
import { ScrollArea } from "@repo/ui/scroll-area"
import { LoaderCircleIcon, XIcon } from "lucide-react"
import { useEffect, useReducer, useRef } from "react"

import ToolInputField, { type ToolInputVariable } from "./tool-input-field"

interface ToolPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inputVariables: ToolInputVariable[]
  onExecute: (inputs: Record<string, string>) => void
  isExecuting: boolean
  result: string | null
}

interface SheetState {
  previewInputs: Record<string, string>
  isVisible: boolean
  validationErrors: Record<string, string>
}

type SheetAction =
  | { type: "SET_INPUT"; variableName: string; value: string }
  | { type: "SET_VISIBLE"; payload: boolean }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "CLEAR_ERROR"; variableName: string }

const sheetInitialState: SheetState = {
  previewInputs: {},
  isVisible: false,
  validationErrors: {},
}

const sheetReducer = (state: SheetState, action: SheetAction): SheetState => {
  switch (action.type) {
    case "SET_INPUT":
      return {
        ...state,
        previewInputs: {
          ...state.previewInputs,
          [action.variableName]: action.value,
        },
      }
    case "SET_VISIBLE":
      return { ...state, isVisible: action.payload }
    case "SET_ERRORS":
      return { ...state, validationErrors: action.payload }
    case "CLEAR_ERROR": {
      const next = { ...state.validationErrors }
      delete next[action.variableName]
      return { ...state, validationErrors: next }
    }
    default:
      return state
  }
}

const ToolPreviewSheet = ({
  open,
  onOpenChange,
  inputVariables,
  onExecute,
  isExecuting,
  result,
}: ToolPreviewSheetProps) => {
  const [{ previewInputs, isVisible, validationErrors }, dispatch] = useReducer(
    sheetReducer,
    sheetInitialState,
  )
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileReaderRef = useRef<FileReader | null>(null)

  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
    }

    if (open) {
      animationTimerRef.current = setTimeout(
        () => dispatch({ type: "SET_VISIBLE", payload: true }),
        10,
      )
    } else {
      animationTimerRef.current = setTimeout(
        () => dispatch({ type: "SET_VISIBLE", payload: false }),
        10,
      )
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

    dispatch({ type: "SET_ERRORS", payload: errors })
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (variableName: string, newValue: string) => {
    dispatch({ type: "SET_INPUT", variableName, value: newValue })
  }

  const handleClearError = (variableName: string) => {
    dispatch({ type: "CLEAR_ERROR", variableName })
  }

  const handleExecutePreview = () => {
    if (!validateInputs()) {
      return
    }
    onExecute(previewInputs)
  }

  const handleClose = () => {
    dispatch({ type: "SET_VISIBLE", payload: false })
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
        role="presentation"
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
                    <ToolInputField
                      field={field}
                      value={previewInputs[field.variableName] || ""}
                      error={validationErrors[field.variableName]}
                      fileReaderRef={fileReaderRef}
                      onChange={handleInputChange}
                      onClearError={handleClearError}
                    />
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
