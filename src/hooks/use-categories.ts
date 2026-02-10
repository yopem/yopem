import { useQuery } from "@tanstack/react-query"

import { queryApi } from "@/lib/orpc/query"

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await queryApi.categories.list.call()
    },
  })
}
