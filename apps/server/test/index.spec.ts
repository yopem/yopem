import app from "server"
import { describe, expect, test } from "vite-plus/test"

describe("server index", () => {
  test("exports the Hono app as default", () => {
    expect(app).toBeDefined()
    expect(typeof app.fetch).toBe("function")
  })

  test("GET /health returns ok", async () => {
    const res = await app.fetch(new Request("http://localhost/health"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: "ok" })
  })

  test("GET /rpc/doc responds (oRPC reference UI mounted)", async () => {
    const res = await app.fetch(new Request("http://localhost/rpc/doc"))
    expect(res.status).toBe(200)
  })

  test("GET /rpc/spec.json returns an OpenAPI document", async () => {
    const res = await app.fetch(new Request("http://localhost/rpc/spec.json"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.openapi).toBeDefined()
    expect(body.info.title).toBe("Yopem RPC API")
  })
})
