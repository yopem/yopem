import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export const useUptimeMetrics = () => {
  return useQuery({
    ...queryApi.admin.getUptimeMetrics.queryOptions(),
    refetchInterval: 30000,
  })
}
