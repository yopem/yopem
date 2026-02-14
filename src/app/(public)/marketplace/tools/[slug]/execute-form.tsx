"use client"

import { useMutation } from "@tanstack/react-query"
import { PlayIcon } from "lucide-react"
import { useState, type ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleExecute = () => {
    setError(null)
    setOutput(null)
    if (!inputValue.trim()) {
      setError("Please provide an input")
      return
    }
    executeMutation.mutate({ input: inputValue })
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Execute Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="input" className="text-sm leading-none font-medium">
            Input
          </label>
          <Input
            id="input"
            placeholder="Enter your input..."
            value={inputValue}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleExecute}
          disabled={executeMutation.isPending}
          className="w-full"
        >
          <PlayIcon className="mr-2 size-4" />
          {executeMutation.isPending
            ? "Executing..."
            : Number(costPerRun ?? 0) > 0
              ? `Execute (${costPerRun} credits)`
              : "Execute"}
        </Button>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        {output && (
          <div className="bg-muted rounded-md p-4">
            <h4 className="mb-2 font-medium">Output:</h4>
            <pre className="text-sm whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
