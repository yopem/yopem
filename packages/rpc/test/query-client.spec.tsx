import { describe, expect, test } from "vite-plus/test"

import { createQueryClient, getQueryClient } from "rpc/query-client"

describe("query-client", () => {
  test("createQueryClient returns a configured QueryClient instance", () => {
    const client = createQueryClient()
    expect(client).toBeDefined()
    expect(client.getDefaultOptions().queries?.staleTime).toBe(60 * 1000)
  })

  test("getQueryClient returns a cached QueryClient instance", () => {
    const client = getQueryClient()
    expect(client).toBeDefined()
  })

  test("queryKeyHashFn serializes query key", () => {
    const client = createQueryClient()
    const hashFn = client.getDefaultOptions().queries?.queryKeyHashFn
    expect(hashFn).toBeDefined()
    if (hashFn) {
      const hash = hashFn(["test", { id: 1 }])
      expect(typeof hash).toBe("string")
      expect(hash).toContain("json")
    }
  })
})
