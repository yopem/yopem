import { queryApi } from "@repo/orpc/query"
import { useQuery } from "@tanstack/react-query"

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return await queryApi.tags.list.call()
    },
  })
}
