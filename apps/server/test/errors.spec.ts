import {
  ApiError,
  CheckoutHandlerError,
  PortalHandlerError,
  RateLimitError,
  WebhookHandlerError,
} from "server/errors"
import { describe, expect, test } from "vite-plus/test"

describe("errors", () => {
  test("RateLimitError captures operation and cause", () => {
    const error = new RateLimitError({ operation: "check", cause: "boom" })
    expect(error.operation).toBe("check")
    expect(error.cause).toBe("boom")
    expect(error.tag).toBe("RateLimitError")
  })

  test("WebhookHandlerError captures operation and cause", () => {
    const error = new WebhookHandlerError({
      operation: "parse",
      cause: new Error("bad"),
    })
    expect(error.operation).toBe("parse")
    expect(error.cause).toBeInstanceOf(Error)
  })

  test("CheckoutHandlerError captures operation and cause", () => {
    const error = new CheckoutHandlerError({
      operation: "create",
      cause: "fail",
    })
    expect(error.name).toBe("CheckoutHandlerError")
  })

  test("PortalHandlerError captures operation and cause", () => {
    const error = new PortalHandlerError({ operation: "create", cause: "fail" })
    expect(error.name).toBe("PortalHandlerError")
  })

  test("ApiError maps BAD_REQUEST to 400", () => {
    const error = new ApiError("BAD_REQUEST", { message: "bad" })
    expect(error.status).toBe(400)
    expect(error.message).toBe("bad")
  })
})
