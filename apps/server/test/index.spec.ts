import { describe, expect, test } from "bun:test"
import { app } from "server"
import { orpcCodeForStatus } from "server/lib/errors"

describe("server index", () => {
  test("exports the Hono app", () => {
    expect(app).toBeDefined()
    expect(typeof app.fetch).toBe("function")
  })

  test("GET /health returns ok", async () => {
    const res = await app.fetch(new Request("http://localhost/health"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: "ok" })
  })

  test("unmatched rpc path returns 404 (url getter on native Request)", async () => {
    const res = await app.fetch(new Request("http://localhost/rpc/nope"))
    expect(res.status).toBe(404)
  })

  test("rpc multipart upload parses FormData through proxy body", async () => {
    const form = new FormData()
    form.set("data", JSON.stringify({ json: null }))
    form.set("0", new File(["x"], "test.txt", { type: "text/plain" }))
    const res = await app.fetch(
      new Request("http://localhost/rpc/assets/upload", {
        method: "POST",
        body: form,
      }),
    )
    expect(res.status).toBe(401)
  })

  test("orpcCodeForStatus maps ApiError statuses to oRPC codes", () => {
    expect(orpcCodeForStatus(400)).toBe("BAD_REQUEST")
    expect(orpcCodeForStatus(401)).toBe("UNAUTHORIZED")
    expect(orpcCodeForStatus(403)).toBe("FORBIDDEN")
    expect(orpcCodeForStatus(404)).toBe("NOT_FOUND")
    expect(orpcCodeForStatus(409)).toBe("CONFLICT")
    expect(orpcCodeForStatus(500)).toBe("INTERNAL_SERVER_ERROR")
    expect(orpcCodeForStatus(418)).toBe("INTERNAL_SERVER_ERROR")
  })
})
