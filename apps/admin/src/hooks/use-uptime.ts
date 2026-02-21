import { queryApi } from "@repo/api/orpc/query"
import { useQuery } from "@tanstack/react-query"

export const useUptimeMetrics = () => {
  return useQuery({
    ...queryApi.admin.getUptimeMetrics.queryOptions(),
    refetchInterval: 30000,
  })
}
