import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export const useSystemMetrics = () => {
  return useQuery({
    ...queryApi.admin.getSystemMetrics.queryOptions(),
  })
}
