import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      return await queryApi.tags.list.call()
    },
  })
}
