import { dehydrate, type QueryClient } from "@tanstack/react-query"

type PrefetchArg = Parameters<QueryClient["prefetchQuery"]>[0]

export async function prefetchQueries<T extends object>(
  queryClient: QueryClient,
  queries: readonly T[],
) {
  await Promise.all(
    queries.map((query) =>
      queryClient.prefetchQuery(query as unknown as PrefetchArg),
    ),
  )
  return dehydrate(queryClient)
}
