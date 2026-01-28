import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export function useAvailableModels() {
  return useQuery({
    ...queryApi.admin.getAvailableModels.queryOptions(),
    staleTime: 5 * 60 * 1000,
  })
}
