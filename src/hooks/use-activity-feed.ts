import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export const useActivityFeed = () => {
  return useQuery({
    ...queryApi.admin.getActivityFeed.queryOptions(),
  })
}
