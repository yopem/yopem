import { describe, expect, test } from "vite-plus/test"

import { createORPCLink } from "rpc/shared"

describe("createORPCLink", () => {
  test("returns an RPCLink instance", () => {
    const link = createORPCLink()
    expect(link).toBeDefined()
    expect(typeof link.call).toBe("function")
  })

  test("accepts a custom fetch function", () => {
    const customFetch = (_input: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve(new Response("{}", { status: 200 }))
    const link = createORPCLink(customFetch)
    expect(link).toBeDefined()
  })
})
