"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  PlayIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export default function ToolExecuteForm({
  toolId,
  costPerRun,
}: ToolExecuteFormProps) {
  const [inputValue, setInputValue] = useState("")
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const cost = Number(costPerRun ?? 0)

  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
  }) as { data: { balance: string } | undefined | null }

  const balance = Number(creditsData?.balance ?? 0)
  const hasInsufficientCredits = cost > 0 && balance < cost

  const executeMutation = useMutation({
    mutationFn: async (inputs: Record<string, unknown>) => {
      const result = await queryApi.tools.execute.call({ toolId, inputs })
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
    if (!inputValue.trim()) {
      setError("Please provide an input")
      return
    }
    executeMutation.mutate({ input: inputValue })
  }

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClear = () => {
    setOutput(null)
    setError(null)
  }

  return (
    <Card className="border-border/50 overflow-hidden shadow-lg">
      <CardHeader className="from-primary/5 via-primary/5 bg-linear-to-r to-transparent pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SparklesIcon className="text-primary size-5" />
          Execute Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <label htmlFor="input" className="text-sm leading-none font-medium">
            Input
          </label>
          <Textarea
            id="input"
            placeholder="Enter your input..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1 min-h-[120px] resize-y"
          />
        </div>

        {cost > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost per run:</span>
              <span className="font-medium">{cost} credits</span>
            </div>
            {creditsData && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your balance:</span>
                <span
                  className={
                    hasInsufficientCredits
                      ? "text-destructive font-medium"
                      : "font-medium"
                  }
                >
                  {balance} credits
                </span>
              </div>
            )}
            {hasInsufficientCredits && (
              <div className="text-destructive mt-2 flex items-center gap-2 text-sm">
                <AlertTriangleIcon className="size-4" />
                Insufficient credits
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleExecute}
          disabled={executeMutation.isPending || hasInsufficientCredits}
          className="w-full"
          size="lg"
        >
          <PlayIcon className="mr-2 size-4" />
          {executeMutation.isPending
            ? "Executing..."
            : cost > 0
              ? `Execute (${cost} credits)`
              : "Execute"}
        </Button>

        {error && (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm">
            <AlertTriangleIcon className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {output && (
          <div className="border-border/50 bg-muted/30 rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-medium">Output</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <CheckIcon className="size-4 text-green-500" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 px-2"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
            <pre className="max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
