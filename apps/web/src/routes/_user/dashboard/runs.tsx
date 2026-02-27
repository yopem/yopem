import { queryApi } from "@repo/orpc/query"
import { formatDateTime } from "@repo/shared/format-date"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2Icon className="size-4 text-green-500" />
    case "failed":
      return <XCircleIcon className="size-4 text-red-500" />
    default:
      return <ClockIcon className="size-4 text-yellow-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    case "failed":
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }
}

export const Route = createFileRoute("/_user/dashboard/runs")({
  component: RunsPage,
})

function RunsPage() {
  const { data: runsData, isLoading } = useQuery({
    ...queryApi.user.getRuns.queryOptions({ input: { limit: 50 } }),
    retry: false,
    refetchOnWindowFocus: false,
  }) as {
    data:
      | {
          runs: {
            id: string
            toolId: string | null
            status: string
            cost: string | null
            createdAt: Date | null
            toolName: string | null
          }[]
          nextCursor: string | undefined
        }
      | undefined
  } & { isLoading: boolean }

  const runs = runsData?.runs ?? []

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">My Runs</h1>
        <p className="text-muted-foreground mt-2">
          View your tool execution history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="text-muted-foreground size-4" />
                        <span className="text-muted-foreground text-sm">
                          Loading...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      Loading...
                    </TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      -
                    </TableCell>
                  </TableRow>
                ))
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No tool runs yet. Visit the marketplace to get started!
                    </p>
                    <div className="mt-4">
                      <Link to="/marketplace">
                        <Button variant="outline">Browse Marketplace</Button>
                      </Link>
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
                      {run.toolName ?? "Unknown Tool"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(run.createdAt) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(run.cost ?? 0) > 0 ? `${run.cost} credits` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
