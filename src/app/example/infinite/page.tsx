import ExampleInfinite from "@/components/example/example-infinite"
import { orpcQuery } from "@/lib/orpc/query"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"

export default function ExampleInfinitePage() {
  const queryClient = getQueryClient()

  void queryClient.prefetchInfiniteQuery(
    orpcQuery.example.infinite.infiniteOptions({
      input: (page: number) => ({ cursor: page }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  )

  return (
    <HydrateClient client={queryClient}>
      <ExampleInfinite />
    </HydrateClient>
  )
}
