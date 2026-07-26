import { QueryClient } from "@tanstack/react-query"
import { describe, expect, test } from "vite-plus/test"

import { createQueryClient, getQueryClient } from "rpc/query-client"

describe("createQueryClient", () => {
  test("returns a QueryClient instance", () => {
    const client = createQueryClient()
    expect(client).toBeInstanceOf(QueryClient)
  })

  test("configures a 60s staleTime default for queries", () => {
    const client = createQueryClient()
    const { queries } = client.getDefaultOptions()
    expect(queries?.staleTime).toBe(60 * 1000)
  })

  test("uses a custom queryKeyHashFn (serializer-backed)", () => {
    const client = createQueryClient()
    const { queries } = client.getDefaultOptions()
    expect(typeof queries?.queryKeyHashFn).toBe("function")
    const hash = queries?.queryKeyHashFn?.(["categoryList"])
    expect(typeof hash).toBe("string")
    expect(hash).toContain("json")
    expect(hash).toContain("meta")
  })
})

describe("getQueryClient", () => {
  test("returns a QueryClient instance (memoized per request via React cache)", () => {
    expect(getQueryClient()).toBeInstanceOf(QueryClient)
  })
})
