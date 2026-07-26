import { createApiClient } from "api-client"
import { describe, expect, test } from "vite-plus/test"

describe("createApiClient", () => {
  test("returns a client with route namespaces", () => {
    const client = createApiClient("https://api.example.com")
    expect(client).toBeDefined()
  })

  test("returns a new client for each call", () => {
    const a = createApiClient("https://a.example.com")
    const b = createApiClient("https://b.example.com")
    expect(a).not.toBe(b)
  })
})
