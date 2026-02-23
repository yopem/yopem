import { queryApi } from "@repo/orpc/query"
import { useQuery } from "@tanstack/react-query"

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return await queryApi.categories.list.call()
    },
  })
}
