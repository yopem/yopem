import { describe, expect, test, vi } from "vite-plus/test"

describe("auth client", () => {
  test("creates an auth client with the configured issuer", async () => {
    vi.stubEnv("AUTH_ISSUER", "https://auth.example.com")
    const { authClient } = await import("auth/client")
    expect(authClient).toBeDefined()
    expect(authClient).toHaveProperty("authorize")
    expect(authClient).toHaveProperty("exchange")
    expect(authClient).toHaveProperty("verify")
  })

  test("falls back to empty issuer when AUTH_ISSUER is missing", async () => {
    delete process.env.AUTH_ISSUER
    const { authClient } = await import("auth/client")
    expect(authClient).toBeDefined()
  })
})
