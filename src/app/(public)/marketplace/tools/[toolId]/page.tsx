"use client"

import React, { use, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, CreditCardIcon, PlayIcon } from "lucide-react"

import Link from "@/components/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { queryApi } from "@/lib/orpc/query"

interface ExecutionResult {
  runId: string
  output: string
  cost: number
}

export default function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>
}) {
  const resolvedParams = use(params) as { toolId: string }
  const toolId = resolvedParams.toolId || ""
  const [inputValue, setInputValue] = useState("")
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: tool, isLoading } = useQuery({
    ...queryApi.tools.getById.queryOptions({ input: { id: toolId } }),
    enabled: !!toolId,
  }) as {
    data:
      | {
          id: string
          name: string
          description: string | null
          costPerRun: string | null
          status: string
          config: Record<string, unknown> | null
          templates: Record<string, string> | null
          createdAt: Date | null
        }
      | undefined
  } & { isLoading: boolean }

  const { data: creditsData } = useQuery({
    ...queryApi.user.getCredits.queryOptions(),
  }) as {
    data: { balance: string } | undefined | null
  }

  const executeMutation = useMutation({
    mutationFn: async (inputs: Record<string, unknown>) => {
      const result = await queryApi.tools.execute.call({ toolId, inputs })
      return result as ExecutionResult
    },
    onSuccess: (data) => {
      setOutput(data.output)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
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

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tool Details</h1>
        <p className="text-muted-foreground mt-2">
          View details and execute this tool.
        </p>
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="bg-muted h-32 rounded" />
        </div>
      )}

      {tool && !isLoading && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{tool.name}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    tool.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tool.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {tool.description ?? "No description available"}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="flex items-center">
                  <CreditCardIcon className="mr-1 h-4 w-4" />
                  {Number(tool.costPerRun ?? 0) > 0
                    ? `${tool.costPerRun} credits/run`
                    : "Free"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Execute Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="input"
                  className="text-sm leading-none font-medium"
                >
                  Input
                </label>
                <Input
                  id="input"
                  placeholder="Enter your input..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleExecute}
                disabled={executeMutation.isPending}
                className="w-full"
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                {executeMutation.isPending
                  ? "Executing..."
                  : Number(tool.costPerRun ?? 0) > 0
                    ? `Execute (${tool.costPerRun} credits)`
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
        </>
      )}

      {!tool && toolId && !isLoading && (
        <Card className="mb-8">
          <CardContent className="text-muted-foreground py-12 text-center">
            Tool not found. Check the ID and try again.
          </CardContent>
        </Card>
      )}

      {creditsData && (
        <div className="text-muted-foreground text-center text-sm">
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          Your balance: {creditsData.balance ?? 0} credits
        </div>
      )}
    </div>
  )
}
