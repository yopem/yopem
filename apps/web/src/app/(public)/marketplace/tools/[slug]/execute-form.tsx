"use client"

import { queryApi } from "@repo/api/orpc/query"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { Field, FieldLabel } from "@repo/ui/field"
import { Textarea } from "@repo/ui/textarea"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangleIcon, CopyIcon, LockIcon, PlayIcon } from "lucide-react"
import { useRef, useState } from "react"

import ToolInputField, {
  type ToolInputVariable,
} from "@/components/tools/tool-input-field"

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

  // Dynamic inputs keyed by variable name (used when inputVariable is provided)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  // Fallback single input (used when inputVariable is null/empty)
  const [fallbackInput, setFallbackInput] = useState("")

  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileReaderRef = useRef<FileReader | null>(null)

  const cost = Number(costPerRun ?? 0)

  const queryClient = useQueryClient()

  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
    enabled: isAuthenticated,
  }) as { data: { balance: string } | undefined | null }

  const balance = Number(creditsData?.balance ?? 0)
  const hasInsufficientCredits = cost > 0 && balance < cost

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
        queryKey: queryApi.user.getCredits.queryOptions().queryKey,
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
    <Card className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-primary/5 border-border/50 border-b px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <PlayIcon className="text-primary size-4.5" />
          Run this tool
        </h2>
      </div>
      <CardContent className="space-y-6 p-6">
        {hasVariables ? (
          <div className="flex flex-col gap-5">
            {inputVariable.map((field) => (
              <Field key={field.variableName} className="space-y-2">
                <FieldLabel className="text-sm font-medium">
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
              Input
            </label>
            <Textarea
              id="input"
              placeholder="Enter your input..."
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              className="min-h-[120px] resize-y rounded-xl"
            />
          </div>
        )}

        {cost > 0 && (
          <div className="bg-muted/40 border-border/50 space-y-2 rounded-xl border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Execution cost</span>
              <span className="text-foreground font-semibold">
                {cost} credits
              </span>
            </div>
            {creditsData && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span
                  className={
                    hasInsufficientCredits
                      ? "text-destructive font-semibold"
                      : "text-foreground font-semibold"
                  }
                >
                  {balance} credits
                </span>
              </div>
            )}
            {hasInsufficientCredits && (
              <div className="text-destructive bg-destructive/10 mt-3 flex items-center gap-2 rounded-lg p-2.5 text-sm font-medium">
                <AlertTriangleIcon className="size-4" />
                Insufficient credits to run this tool
              </div>
            )}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="border-border bg-muted/20 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
            <div className="bg-muted/50 rounded-full p-3">
              <LockIcon className="text-muted-foreground size-5" />
            </div>
            <p className="text-foreground font-medium">
              Authentication required
            </p>
            <p className="text-muted-foreground text-sm">
              Sign in to execute this tool and view results
            </p>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={handleExecute}
            disabled={executeMutation.isPending || hasInsufficientCredits}
            className="h-12 w-full rounded-xl text-base font-medium"
          >
            {executeMutation.isPending ? (
              <>
                <div className="border-background/30 border-t-background mr-2 size-4 animate-spin rounded-full border-2" />
                Processing...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 size-4.5" />
                {cost > 0 ? `Run tool (${cost} credits)` : "Run tool"}
              </>
            )}
          </Button>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl p-4 text-sm font-medium">
            <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {output && (
          <div className="border-border/80 bg-muted/20 overflow-hidden rounded-xl border">
            <div className="bg-muted/40 border-border/80 flex items-center justify-between border-b px-4 py-2.5">
              <span className="text-sm font-semibold tracking-tight">
                Result Output
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="hover:bg-muted/60 h-8 rounded-md px-2.5 text-xs"
                >
                  <CopyIcon className="mr-1.5 size-3.5" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="hover:bg-muted/60 h-8 rounded-md px-2.5 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="p-4">
              <pre className="max-h-[300px] overflow-auto font-mono text-sm/relaxed whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
