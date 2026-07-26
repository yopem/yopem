import app from "server"
import { describe, expect, test } from "vitest"

describe("server app", () => {
  test("has a health endpoint", async () => {
    const res = await app.request("/health")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: "ok" })
  })

  test("exposes openapi docs", async () => {
    const res = await app.request("/doc")
    expect(res.status).toBe(200)
  })
})
