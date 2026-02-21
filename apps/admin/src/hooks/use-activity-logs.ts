import { queryApi } from "@repo/api/orpc/query"
import { useQuery } from "@tanstack/react-query"

interface UseActivityLogsOptions {
  eventType?: "auth" | "system" | "payment" | "tool" | "api" | "webhook"
  severity?: "critical" | "error" | "warning" | "info" | "debug"
  startDate?: Date
  endDate?: Date
  cursor?: string
  limit?: number
}

export const useActivityLogs = (options: UseActivityLogsOptions = {}) => {
  const {
    eventType,
    severity,
    startDate,
    endDate,
    cursor,
    limit = 50,
  } = options

  return useQuery({
    ...queryApi.admin.getActivityLogs.queryOptions({
      input: {
        eventType,
        severity,
        startDate,
        endDate,
        cursor,
        limit,
      },
    }),
    refetchInterval: 30000,
  })
}
