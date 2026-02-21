import { queryApi } from "@repo/api/orpc/query"
import { useQuery } from "@tanstack/react-query"

export function useAvailableModels() {
  return useQuery({
    ...queryApi.admin.getAvailableModels.queryOptions(),
    staleTime: 5 * 60 * 1000,
  })
}
