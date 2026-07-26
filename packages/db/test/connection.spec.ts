import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("env", () => ({
  databaseUrl: "postgres://test-db",
}))

describe("dbConnectionString", () => {
  test("returns the configured database URL", async () => {
    const { dbConnectionString } = await import("db/connection")
    expect(dbConnectionString()).toBe("postgres://test-db")
  })
})

describe("dbConnectionString without DATABASE_URL", () => {
  test("throws when DATABASE_URL is not set", async () => {
    vi.resetModules()
    vi.doMock("env", () => ({ databaseUrl: "" }))
    const { dbConnectionString } = await import("db/connection")
    expect(() => dbConnectionString()).toThrow("DATABASE_URL")
    vi.doUnmock("env")
  })
})
