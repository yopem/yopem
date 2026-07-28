import app from "server"
import { orpcCodeForStatus } from "server/errors"
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
