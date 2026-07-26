import type { QueryClient } from "@tanstack/react-query"

export const prefetch = async (
  queryClient: QueryClient,
  options: Parameters<QueryClient["prefetchQuery"]>[0],
): Promise<void> => {
  await queryClient.prefetchQuery(options)
}
