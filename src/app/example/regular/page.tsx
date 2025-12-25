import ExampleRegular from "@/components/example/example-regular"
import { orpcQuery } from "@/lib/orpc/query"
import { getQueryClient, HydrateClient } from "@/lib/query/hydration"

export default function ExampleRegularPage() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(
    orpcQuery.example.all.queryOptions({
      input: {
        page: 1,
        limit: 10,
      },
    }),
  )

  return (
    <HydrateClient client={queryClient}>
      <ExampleRegular />
    </HydrateClient>
  )
}
