"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangleIcon, CopyIcon, LockIcon, PlayIcon } from "lucide-react"
import { useRef, useState } from "react"

import ToolInputField, {
  type ToolInputVariable,
} from "@/components/admin/tools/tool-input-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { queryApi } from "@/lib/orpc/query"

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Run tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasVariables ? (
          <div className="flex flex-col gap-4">
            {inputVariable.map((field) => (
              <Field key={field.variableName}>
                <FieldLabel>{field.variableName}</FieldLabel>
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
          <div>
            <label htmlFor="input" className="text-sm font-medium">
              Input
            </label>
            <Textarea
              id="input"
              placeholder="Enter your input..."
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        )}

        {cost > 0 && (
          <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Cost:</span>
              <span className="font-medium">{cost} credits</span>
            </div>
            {creditsData && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Balance:
                </span>
                <span
                  className={
                    hasInsufficientCredits
                      ? "font-medium text-red-600"
                      : "font-medium"
                  }
                >
                  {balance} credits
                </span>
              </div>
            )}
            {hasInsufficientCredits && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertTriangleIcon className="size-4" />
                Insufficient credits
              </div>
            )}
          </div>
        )}

        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-4 text-center">
            <LockIcon className="text-muted-foreground size-5" />
            <p className="text-muted-foreground text-sm">
              Sign in to run this tool
            </p>
          </div>
        ) : (
          <Button
            onClick={handleExecute}
            disabled={executeMutation.isPending || hasInsufficientCredits}
            className="w-full"
          >
            <PlayIcon className="mr-2 size-4" />
            {executeMutation.isPending
              ? "Running..."
              : cost > 0
                ? `Run (${cost} credits)`
                : "Run"}
          </Button>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {output && (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Output</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2"
                >
                  <CopyIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2"
                >
                  Clear
                </Button>
              </div>
            </div>
            <pre className="max-h-[200px] overflow-auto text-sm whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
