import { ArrowLeftIcon, CreditCardIcon } from "lucide-react"
import { Suspense } from "react"

import Link from "@/components/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { serverApi } from "@/lib/orpc/server"

import ToolExecuteForm from "./execute-form"
import UserCredits from "./user-credits"

async function ToolData({ toolId }: { toolId: string }) {
  let tool
  try {
    tool = await serverApi.tools.getById({ id: toolId })
  } catch (error) {
    console.error(`Error fetching tool with ID "${toolId}":`, error)
    return (
      <Card className="mb-8">
        <CardContent className="text-muted-foreground py-12 text-center">
          <p>Tool not found (ID: {toolId})</p>
          <p className="mt-2 text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!tool) {
    return (
      <Card className="mb-8">
        <CardContent className="text-muted-foreground py-12 text-center">
          Tool not found (ID: {toolId})
        </CardContent>
      </Card>
    )
  }

  return (
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
              <CreditCardIcon className="mr-1 size-4" />
              {Number(tool.costPerRun ?? 0) > 0
                ? `${tool.costPerRun} credits/run`
                : "Free"}
            </span>
          </div>
        </CardContent>
      </Card>

      <ToolExecuteForm toolId={toolId} costPerRun={tool.costPerRun} />

      <Suspense fallback={null}>
        <UserCredits />
      </Suspense>
    </>
  )
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>
}) {
  const { toolId } = await params

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Link
        href="/marketplace"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center text-sm"
      >
        <ArrowLeftIcon className="mr-2 size-4" />
        Back to Marketplace
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tool Details</h1>
        <p className="text-muted-foreground mt-2">
          View details and execute this tool.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-1/3 rounded-sm" />
            <div className="bg-muted h-32 rounded-sm" />
          </div>
        }
      >
        <ToolData toolId={toolId} />
      </Suspense>
    </div>
  )
}
