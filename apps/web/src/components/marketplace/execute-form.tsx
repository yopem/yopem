"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  AlertTriangleIcon,
  CopyIcon,
  CrownIcon,
  LockIcon,
  PlayIcon,
  SparklesIcon,
} from "lucide-react"
import { useRef, useState } from "react"

import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Field, FieldLabel } from "ui/field"
import { Textarea } from "ui/textarea"
import ToolInputField, { type ToolInputVariable } from "ui/tool-input-field"

interface ExecutionResult {
  runId: string
  output: string
  cost: number
}

interface ToolExecuteFormProps {
  toolId: string
  costPerRun: string | null
  inputVariable?: ToolInputVariable[] | null
  isAuthenticated: boolean
}

export default function ToolExecuteForm({
  toolId,
  costPerRun,
  inputVariable,
  isAuthenticated,
}: ToolExecuteFormProps) {
  const hasVariables = inputVariable && inputVariable.length > 0

  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [fallbackInput, setFallbackInput] = useState("")

  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileReaderRef = useRef<FileReader | null>(null)

  const cost = Number(costPerRun ?? 0)
  const requiresPaidPlan = cost > 0

  const queryClient = useQueryClient()

  const { data: subscription } = useQuery({
    ...queryApi.user.getSubscription.queryOptions(),
    enabled: isAuthenticated,
  }) as {
    data:
      | {
          tier: "free" | "pro" | "enterprise"
          isPaid: boolean
        }
      | undefined
      | null
  }

  const hasAccess = !requiresPaidPlan || (subscription?.isPaid ?? false)

  const executeMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const result = await queryApi.tools.execute.call({
        toolId,
        inputs: payload,
      })
      return result as ExecutionResult
    },
    onSuccess: (data) => {
      setOutput(data.output)
      setError(null)
      void queryClient.invalidateQueries({
        queryKey: queryApi.user.getSubscription.queryOptions().queryKey,
      })
    },
    onError: (error: Error) => {
      setError(error.message)
      setOutput(null)
    },
  })

  const handleExecute = () => {
    setError(null)
    setOutput(null)

    if (hasVariables) {
      executeMutation.mutate(inputs)
    } else {
      if (!fallbackInput.trim()) {
        setError("Please provide an input")
        return
      }
      executeMutation.mutate({ input: fallbackInput })
    }
  }

  const handleInputChange = (variableName: string, newValue: string) => {
    setInputs((prev) => ({ ...prev, [variableName]: newValue }))
  }

  const handleClearError = (_variableName: string) => {
    // no per-field errors in this form
  }

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const handleClear = () => {
    setOutput(null)
    setError(null)
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="space-y-6 p-5 sm:p-6">
        {hasVariables ? (
          <div className="grid gap-5">
            {inputVariable.map((field) => (
              <Field key={field.variableName} className="space-y-2">
                <FieldLabel className="text-foreground text-sm font-medium">
                  {field.variableName}
                </FieldLabel>
                <ToolInputField
                  field={field}
                  value={inputs[field.variableName] ?? ""}
                  error={undefined}
                  fileReaderRef={fileReaderRef}
                  onChange={handleInputChange}
                  onClearError={handleClearError}
                />
              </Field>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="input"
              className="text-foreground text-sm font-medium"
            >
              Input Data
            </label>
            <Textarea
              id="input"
              placeholder="Enter your input data here..."
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              className="min-h-[160px] resize-y"
            />
          </div>
        )}

        {requiresPaidPlan && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CrownIcon className="size-4 text-amber-500" />
                <span className="text-foreground text-sm font-medium">
                  Premium Tool
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Pro & Enterprise
              </Badge>
            </div>
            {!hasAccess && subscription && (
              <div className="border-border/50 mt-3 border-t pt-3">
                <div className="text-muted-foreground text-sm">
                  Upgrade to Pro to use this tool
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  render={<Link to="/dashboard/subscription" />}
                >
                  <SparklesIcon className="mr-1.5 size-3.5" />
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          {!isAuthenticated ? (
            <div className="border-border bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
              <div className="bg-background border-border/50 rounded-full border p-3 shadow-xs">
                <LockIcon className="text-muted-foreground size-5" />
              </div>
              <div>
                <p className="text-foreground font-medium">
                  Authentication required
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Sign in to execute this tool and view results
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending || !hasAccess}
              className="w-full"
            >
              {executeMutation.isPending ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  Run tool
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4 text-sm">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {output && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-medium">Result Output</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs"
                >
                  <CopyIcon className="mr-1.5 size-3.5" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 px-3 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="border-border bg-muted/30 rounded-lg border">
              <pre className="max-h-[400px] overflow-auto p-4 font-mono text-sm whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
