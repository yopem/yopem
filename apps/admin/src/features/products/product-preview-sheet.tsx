"use client"

import { LoaderCircleIcon, XIcon } from "lucide-react"
import { useEffect, useReducer, useRef, useState } from "react"

import { Button } from "ui/button"
import { Field, FieldLabel } from "ui/field"
import { ScrollArea } from "ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "ui/tabs"

import {
  ProductInputField,
  type ProductInputVariable,
} from "@/features/products/product-input-field"

interface PreviewStep {
  nodeId: string
  outputName: string
  value: string
  status: string
}

interface ProductPreviewSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inputVariables: ProductInputVariable[]
  onExecute: (inputs: Record<string, string>) => void
  isExecuting: boolean
  result: string | null
  steps?: PreviewStep[]
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

export function ProductPreviewSheet({
  open,
  onOpenChange,
  inputVariables,
  onExecute,
  isExecuting,
  result,
  steps = [],
}: ProductPreviewSheetProps) {
  const [{ previewInputs, isVisible, validationErrors }, dispatch] = useReducer(
    sheetReducer,
    sheetInitialState,
  )
  const [mode, setMode] = useState<"user" | "admin">("user")
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
    dispatch({
      type: "SET_INPUT",
      variableName,
      value: newValue,
    })
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
        className={`bg-popover text-popover-foreground fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l shadow-lg transition-transform duration-200 ease-in-out ${
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

        <div className="border-border flex flex-col gap-2 border-b p-6">
          <h2 className="font-heading text-xl leading-none font-semibold">
            Product Preview
          </h2>
          <p className="text-muted-foreground text-sm">
            Preview your product with sample inputs before deploying.
          </p>
        </div>

        <div className="border-border border-b p-4">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "user" | "admin")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">User View</TabsTrigger>
              <TabsTrigger value="admin">Admin Steps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 p-6">
            {mode === "user" ? (
              <UserPreviewTab
                inputVariables={inputVariables}
                previewInputs={previewInputs}
                validationErrors={validationErrors}
                isExecuting={isExecuting}
                result={result}
                fileReaderRef={fileReaderRef}
                onInputChange={handleInputChange}
                onClearError={handleClearError}
                onExecute={handleExecutePreview}
              />
            ) : (
              <AdminPreviewTab
                inputVariables={inputVariables}
                previewInputs={previewInputs}
                validationErrors={validationErrors}
                isExecuting={isExecuting}
                result={result}
                steps={steps}
                fileReaderRef={fileReaderRef}
                onInputChange={handleInputChange}
                onClearError={handleClearError}
                onExecute={handleExecutePreview}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

function UserPreviewTab({
  inputVariables,
  previewInputs,
  validationErrors,
  isExecuting,
  result,
  fileReaderRef,
  onInputChange,
  onClearError,
  onExecute,
}: {
  inputVariables: ProductInputVariable[]
  previewInputs: Record<string, string>
  validationErrors: Record<string, string>
  isExecuting: boolean
  result: string | null
  fileReaderRef: React.RefObject<FileReader | null>
  onInputChange: (variableName: string, value: string) => void
  onClearError: (variableName: string) => void
  onExecute: () => void
}) {
  return (
    <>
      <div className="flex flex-col gap-4">
        {inputVariables.map((field) => (
          <Field key={field.variableName}>
            <FieldLabel>{field.variableName}</FieldLabel>
            <ProductInputField
              field={field}
              value={previewInputs[field.variableName] || ""}
              error={validationErrors[field.variableName]}
              fileReaderRef={fileReaderRef}
              onChange={onInputChange}
              onClearError={onClearError}
            />
            {validationErrors[field.variableName] && (
              <p className="text-destructive mt-1 text-xs">
                {validationErrors[field.variableName]}
              </p>
            )}
          </Field>
        ))}
      </div>

      <Button onClick={onExecute} disabled={isExecuting}>
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
    </>
  )
}

function AdminPreviewTab({
  inputVariables,
  previewInputs,
  validationErrors,
  isExecuting,
  result,
  steps,
  fileReaderRef,
  onInputChange,
  onClearError,
  onExecute,
}: {
  inputVariables: ProductInputVariable[]
  previewInputs: Record<string, string>
  validationErrors: Record<string, string>
  isExecuting: boolean
  result: string | null
  steps: PreviewStep[]
  fileReaderRef: React.RefObject<FileReader | null>
  onInputChange: (variableName: string, value: string) => void
  onClearError: (variableName: string) => void
  onExecute: () => void
}) {
  return (
    <>
      <div className="flex flex-col gap-4">
        {inputVariables.map((field) => (
          <Field key={field.variableName}>
            <FieldLabel>{field.variableName}</FieldLabel>
            <ProductInputField
              field={field}
              value={previewInputs[field.variableName] || ""}
              error={validationErrors[field.variableName]}
              fileReaderRef={fileReaderRef}
              onChange={onInputChange}
              onClearError={onClearError}
            />
          </Field>
        ))}
      </div>

      <Button onClick={onExecute} disabled={isExecuting}>
        {isExecuting ? (
          <>
            <LoaderCircleIcon className="size-4 animate-spin" />
            <span>Running workflow...</span>
          </>
        ) : (
          "Run workflow"
        )}
      </Button>

      {steps.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold">Step outputs</h4>
          {steps.map((step) => (
            <div
              key={`${step.nodeId}-${step.outputName}`}
              className="bg-muted rounded-lg border p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase">
                  {step.outputName}
                </span>
                <span
                  className={`text-[10px] ${
                    step.status === "completed"
                      ? "text-green-600"
                      : step.status === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.status}
                </span>
              </div>
              <pre className="text-muted-foreground max-h-32 overflow-auto text-xs whitespace-pre-wrap">
                {step.value}
              </pre>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="bg-muted rounded-lg border p-4">
          <h4 className="mb-2 font-semibold">Final Output</h4>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </>
  )
}
