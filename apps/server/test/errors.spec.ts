import { describe, expect, test } from "bun:test"
import { ApiError, RateLimitError } from "server/lib/errors"

describe("errors", () => {
  test("RateLimitError captures operation and cause", () => {
    const error = new RateLimitError({ operation: "check", cause: "boom" })
    expect(error.operation).toBe("check")
    expect(error.cause).toBe("boom")
    expect(error.tag).toBe("RateLimitError")
  })

  test("ApiError maps BAD_REQUEST to 400", () => {
    const error = new ApiError("BAD_REQUEST", { message: "bad" })
    expect(error.status).toBe(400)
    expect(error.message).toBe("bad")
  })
})
