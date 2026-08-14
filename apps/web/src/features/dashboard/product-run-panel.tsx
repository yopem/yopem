"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CoinsIcon,
  Loader2Icon,
  PlayIcon,
} from "lucide-react"
import { useRef, useState } from "react"

import { queryApi } from "rpc/query"
import { Button } from "ui/button"
import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
import { Label } from "ui/label"

import { ProductInputField } from "@/features/storefront/product-input-field"
import { RichTextView } from "@/features/storefront/rich-text-view"

interface WorkflowField {
  variableName: string
  description: string
  type: string
  isOptional?: boolean
  options?: { label: string; value: string }[]
}

interface WorkflowNode {
  type?: string
  data?: { fields?: unknown[] }
}

export interface ProductRunPanelProps {
  product: {
    id: string
    name: string
    creditsPerRun: number | null
    outputFormat: string | null
    workflow: unknown
  }
}

export function ProductRunPanel({ product }: ProductRunPanelProps) {
  const [executionResult, setExecutionResult] = useState<unknown>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  const executeMutation = useMutation(
    queryApi.products.execute.mutationOptions({
      onSuccess: (data) => {
        setExecutionResult(data.output)
        setExecutionError(null)
      },
      onError: (err) => {
        setExecutionError(err.message || "Failed to execute tool")
      },
    }),
  )

  const workflowNodes =
    (product.workflow as { nodes?: WorkflowNode[] } | undefined)?.nodes ?? []
  const inputFields: WorkflowField[] = workflowNodes
    .filter((n) => n.type === "input")
    .flatMap((n) => (n.data?.fields as WorkflowField[] | undefined) ?? [])

  const defaultValues = Object.fromEntries(
    inputFields.map((f) => [f.variableName, ""]),
  )

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      setExecutionError(null)
      executeMutation.mutate({
        id: product.id,
        inputs: value,
      })
    },
  })

  const fileReaderRef = useRef<FileReader | null>(null)

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardPanel className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="space-y-5"
          >
            {inputFields.length === 0 ? (
              <p className="text-muted-foreground text-xs italic">
                No parameter inputs required. Click run to execute.
              </p>
            ) : (
              inputFields.map((field) => (
                <form.Field key={field.variableName} name={field.variableName}>
                  {(fieldState) => (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={field.variableName}
                        className="text-xs font-medium"
                      >
                        {field.description || field.variableName}
                        {!field.isOptional && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <ProductInputField
                        field={field}
                        value={fieldState.state.value}
                        fileReaderRef={fileReaderRef}
                        onChange={(_, val) => fieldState.handleChange(val)}
                      />
                    </div>
                  )}
                </form.Field>
              ))
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CoinsIcon className="size-4" />
                <span>
                  {product.creditsPerRun
                    ? `${product.creditsPerRun} credits per run`
                    : "Free run"}
                </span>
              </div>

              <Button
                type="submit"
                size="default"
                className="gap-2 font-medium"
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="size-4 fill-current" />
                    <span>Run Tool</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardPanel>
      </Card>

      {executionError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardPanel className="text-destructive flex items-start gap-3 p-4">
            <AlertCircleIcon className="size-5 shrink-0" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Execution Failed</p>
              <p className="leading-relaxed">{executionError}</p>
            </div>
          </CardPanel>
        </Card>
      )}

      {executionResult !== null && (
        <Card className="border-border bg-card">
          <CardHeader className="border-border border-b pb-3">
            <CardTitle className="font-heading flex items-center gap-2 text-base font-semibold">
              <CheckCircle2Icon className="size-4 text-green-500" />
              Execution Output
            </CardTitle>
          </CardHeader>
          <CardPanel className="p-5">
            {product.outputFormat === "image" &&
            typeof executionResult === "string" ? (
              <div className="border-border overflow-hidden rounded-lg border">
                <img
                  src={executionResult}
                  alt="Generated output"
                  className="w-full object-contain"
                />
              </div>
            ) : typeof executionResult === "string" ? (
              <div className="max-w-none text-sm leading-relaxed">
                <RichTextView content={executionResult} />
              </div>
            ) : (
              <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono text-xs">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            )}
          </CardPanel>
        </Card>
      )}
    </div>
  )
}
