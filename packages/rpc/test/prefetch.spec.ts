import { QueryClient } from "@tanstack/react-query"
import { describe, expect, test } from "vite-plus/test"

import { prefetchQueries } from "rpc/prefetch"

describe("prefetchQueries", () => {
  test("prefetches queries and returns dehydrated state", async () => {
    const queryClient = new QueryClient()
    const queries = [
      { queryKey: ["test"], queryFn: () => Promise.resolve("data") },
    ]

    const dehydrated = await prefetchQueries(queryClient, queries)

    expect(dehydrated).toBeDefined()
    expect(dehydrated.queries).toBeDefined()
    expect(queryClient.getQueryData(["test"])).toBe("data")
  })

  test("handles empty queries array", async () => {
    const queryClient = new QueryClient()

    const dehydrated = await prefetchQueries(queryClient, [])

    expect(dehydrated).toBeDefined()
    expect(dehydrated.queries).toEqual([])
  })
})
