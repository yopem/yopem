import { queryApi } from "@repo/orpc/query"
import { useQuery } from "@tanstack/react-query"

export const useActivityFeed = () => {
  return useQuery({
    ...queryApi.admin.getActivityFeed.queryOptions(),
  })
}
