import { describe, expect, test } from "bun:test"
import { Hono } from "hono"
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  clearLoginOriginCookie,
  sessionCookieOptions,
  setSessionCookies,
} from "server/lib/cookies"

const app = new Hono()

app.get("/set", (c) => {
  setSessionCookies(c, "access", "refresh")
  return c.text("ok")
})

app.get("/clear", (c) => {
  clearLoginOriginCookie(c)
  return c.text("ok")
})

describe("session cookie helpers", () => {
  test("setSessionCookies writes access and refresh cookies", async () => {
    const res = await app.request("/set")
    const headers = res.headers.getSetCookie()
    expect(headers.some((h) => h.startsWith("access_token=access"))).toBe(true)
    expect(headers.some((h) => h.startsWith("refresh_token=refresh"))).toBe(
      true,
    )
  })

  test("cookie options are httpOnly and path /", () => {
    expect(sessionCookieOptions.httpOnly).toBe(true)
    expect(sessionCookieOptions.path).toBe("/")
    expect(ACCESS_TOKEN_MAX_AGE).toBe(86400)
    expect(REFRESH_TOKEN_MAX_AGE).toBe(604800)
  })

  test("clearLoginOriginCookie deletes the login_origin cookie", async () => {
    const res = await app.request("/clear")
    const headers = res.headers.getSetCookie()
    expect(
      headers.some(
        (h) => h.startsWith("login_origin=") && h.includes("Max-Age=0"),
      ),
    ).toBe(true)
  })
})
