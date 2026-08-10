import { describe, expect, test } from "bun:test"
import {
  authCallbackRoute,
  resolveLoginOrigin,
} from "server/handlers/auth-callback"

const allowed = ["http://localhost:3000", "http://localhost:3001"]
const defaultOrigin = "http://localhost:3000"

describe("auth-callback handler", () => {
  test("exports a route", () => {
    expect(authCallbackRoute).toBeDefined()
  })
})

describe("resolveLoginOrigin", () => {
  test("web login_origin with path preserves origin and returnTo path", () => {
    expect(
      resolveLoginOrigin(
        "http://localhost:3000/products/foo",
        allowed,
        defaultOrigin,
        "/",
      ),
    ).toEqual({
      origin: "http://localhost:3000",
      redirectPath: "/products/foo",
    })
  })

  test("admin bare login_origin resolves to its origin", () => {
    expect(
      resolveLoginOrigin("http://localhost:3001", allowed, defaultOrigin, "/"),
    ).toEqual({ origin: "http://localhost:3001", redirectPath: "/" })
  })

  test("missing login_origin falls back to default origin and query redirect", () => {
    expect(
      resolveLoginOrigin(undefined, allowed, defaultOrigin, "/dashboard"),
    ).toEqual({ origin: "http://localhost:3000", redirectPath: "/dashboard" })
  })

  test("unrecognized login_origin falls back to default origin", () => {
    expect(
      resolveLoginOrigin("http://evil.com/x", allowed, defaultOrigin, "/"),
    ).toEqual({ origin: "http://localhost:3000", redirectPath: "/" })
  })
})
