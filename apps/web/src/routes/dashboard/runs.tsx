import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router"
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"

import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table"

const getStatusIcon = (status: string | null) => {
  switch (status) {
    case "completed":
      return <CheckCircle2Icon className="size-4 text-green-500" />
    case "failed":
      return <XCircleIcon className="size-4 text-red-500" />
    default:
      return <ClockIcon className="size-4 text-yellow-500" />
  }
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
          Failed
        </Badge>
      )
    default:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          Pending
        </Badge>
      )
  }
}

export const Route = createFileRoute("/dashboard/runs")({
  loader: async ({ context: { queryClient } }) => {
    const runs = await queryClient.ensureQueryData(
      queryApi.user.runs.queryOptions({ input: { limit: 50 } }),
    )
    return { runs }
  },
  component: RunsComponent,
})

function RunsComponent() {
  const { runs: initialRuns } = useLoaderData({ from: "/dashboard/runs" })
  const runsQuery = useQuery(
    queryApi.user.runs.queryOptions({ input: { limit: 50 } }),
  )
  const runsData = runsQuery.data ?? initialRuns
  const runs = runsData.runs ?? []

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Runs</h1>
        <p className="text-muted-foreground mt-2">
          View your product execution history.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-border border-b p-5">
          <CardTitle className="text-base font-semibold">
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardPanel className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      No product runs yet. Visit the marketplace to get started!
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        render={<Link to="/products">Browse Marketplace</Link>}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        {getStatusBadge(run.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {run.productName ?? "Unknown Product"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {run.createdAt
                        ? new Date(run.createdAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(run.cost ?? 0) > 0
                        ? `${run.cost} credits`
                        : "Free"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardPanel>
      </Card>
    </div>
  )
}
