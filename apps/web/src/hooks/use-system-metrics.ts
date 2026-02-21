import { queryApi } from "@repo/api/orpc/query"
import { useQuery } from "@tanstack/react-query"

export const useSystemMetrics = () => {
  return useQuery({
    ...queryApi.admin.getSystemMetrics.queryOptions(),
  })
}
