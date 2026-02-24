"use client"

import { formatDateTime } from "@repo/shared/format-date"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from "lucide-react"
import { useState } from "react"
import { Shimmer } from "shimmer-from-structure"

import { useActivityLogs } from "@/hooks/use-activity-logs"

const severityColors: Record<
  string,
  "default" | "destructive" | "warning" | "info" | "success"
> = {
  critical: "destructive",
  error: "destructive",
  warning: "warning",
  info: "info",
  debug: "success",
}

const ActivityLogsList = () => {
  const [eventType, setEventType] = useState<string>("all")
  const [severity, setSeverity] = useState<string>("all")
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const { data, isLoading } = useActivityLogs({
    eventType:
      eventType === "all"
        ? undefined
        : (eventType as
            | "auth"
            | "system"
            | "payment"
            | "tool"
            | "api"
            | "webhook"),
    severity:
      severity === "all"
        ? undefined
        : (severity as "critical" | "error" | "warning" | "info" | "debug"),
    cursor,
    limit: 50,
  })

  const handleNext = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor)
    }
  }

  const handlePrevious = () => {
    setCursor(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Logs</CardTitle>
          <div className="flex items-center gap-2">
            <FilterIcon className="text-muted-foreground size-4" />
            <Select
              value={eventType}
              onValueChange={(value) => {
                if (value) {
                  setEventType(value)
                  setCursor(undefined)
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={severity}
              onValueChange={(value) => {
                if (value) {
                  setSeverity(value)
                  setCursor(undefined)
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Shimmer loading={isLoading}>
          <div className="space-y-4">
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="h-10 px-4 text-left text-sm font-medium">
                      Timestamp
                    </th>
                    <th className="h-10 px-4 text-left text-sm font-medium">
                      Type
                    </th>
                    <th className="h-10 px-4 text-left text-sm font-medium">
                      Severity
                    </th>
                    <th className="h-10 px-4 text-left text-sm font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/50 border-t transition-colors"
                    >
                      <td className="p-4 text-sm">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="p-4 text-sm capitalize">
                        {log.eventType}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={severityColors[log.severity] ?? "default"}
                        >
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{log.description}</td>
                    </tr>
                  ))}
                  {data?.logs.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-muted-foreground p-4 text-center"
                      >
                        No activity logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {data?.logs.length ?? 0} of {data?.totalCount ?? 0} logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={!cursor}
                >
                  <ChevronLeftIcon className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!data?.nextCursor}
                >
                  Next
                  <ChevronRightIcon className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </Shimmer>
      </CardContent>
    </Card>
  )
}

export default ActivityLogsList
