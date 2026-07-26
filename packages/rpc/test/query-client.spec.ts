import { QueryClient } from "@tanstack/react-query"
import { describe, expect, test } from "vite-plus/test"

import { createQueryClient } from "rpc/query-client"

describe("createQueryClient", () => {
  test("returns a QueryClient instance", () => {
    const client = createQueryClient()
    expect(client).toBeInstanceOf(QueryClient)
  })

  test("configures query defaults (staleTime 30s, no window-focus refetch)", () => {
    const client = createQueryClient()
    const { queries } = client.getDefaultOptions()
    expect(queries?.staleTime).toBe(30 * 1000)
    expect(queries?.refetchOnWindowFocus).toBe(false)
  })

  test("configures mutation defaults (no retry)", () => {
    const client = createQueryClient()
    const { mutations } = client.getDefaultOptions()
    expect(mutations?.retry).toBe(0)
  })
})
