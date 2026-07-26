import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

describe("env", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("reads DATABASE_URL from process.env", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test-db")
    const mod = await import("env")
    expect(mod.databaseUrl).toBe("postgres://test-db")
  })

  test("uses empty string when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL
    const mod = await import("env")
    expect(mod.databaseUrl).toBe("")
  })

  test("parses SERVER_PORT as a number with fallback", async () => {
    vi.stubEnv("SERVER_PORT", "8080")
    const mod = await import("env")
    expect(mod.serverPort).toBe(8080)
  })

  test("falls back to 4000 when SERVER_PORT is invalid", async () => {
    vi.stubEnv("SERVER_PORT", "not-a-number")
    const mod = await import("env")
    expect(mod.serverPort).toBe(4000)
  })

  test("falls back to 4000 when SERVER_PORT is missing", async () => {
    delete process.env.SERVER_PORT
    const mod = await import("env")
    expect(mod.serverPort).toBe(4000)
  })

  test("isDev is true when DEV is set to true", async () => {
    process.env.DEV = "true"
    const mod = await import("env")
    expect(mod.isDev).toBe(true)
    expect(mod.isProd).toBe(false)
  })
})
