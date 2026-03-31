import { Result, TaggedError } from "better-result"
import { Hono } from "hono"
import { getCookie, deleteCookie } from "hono/cookie"

import { logger } from "logger"

import { authClient, setTokenCookies } from "@/auth"

export class AuthCallbackError extends TaggedError("AuthCallbackError")<{
  message: string
  cause?: unknown
}>() {}

const appEnv = process.env["APP_ENV"] ?? "development"
const allowedOrigins =
  appEnv === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : [
        process.env["WEB_ORIGIN"] ?? "",
        process.env["ADMIN_ORIGIN"] ?? "",
      ].filter(Boolean)
const defaultOrigin = allowedOrigins[0] ?? "http://localhost:3000"
const serverOrigin =
  appEnv === "development"
    ? "http://localhost:4000"
    : (process.env["PUBLIC_API_URL"] ?? "")

export const authCallbackRoute = new Hono()

authCallbackRoute.get("/callback", async (c) => {
  const code = c.req.query("code")
  const redirectPath = c.req.query("redirect") ?? "/"

  if (!code) {
    return c.json({ error: "Missing code parameter" }, 400)
  }

  const callbackUrl = `${serverOrigin}/auth/callback`

  const result = await Result.tryPromise({
    try: async () => {
      const exchanged = await authClient.exchange(code, callbackUrl)

      if (exchanged.err) {
        throw new AuthCallbackError({
          message: `Token exchange failed: ${JSON.stringify(exchanged.err)}`,
        })
      }

      setTokenCookies(c, exchanged.tokens.access, exchanged.tokens.refresh)

      const loginOrigin = getCookie(c, "login_origin")
      const origin =
        loginOrigin && allowedOrigins.includes(loginOrigin)
          ? loginOrigin
          : defaultOrigin
      deleteCookie(c, "login_origin", { path: "/" })

      return `${origin}${redirectPath}`
    },
    catch: (error) =>
      error instanceof AuthCallbackError
        ? error
        : new AuthCallbackError({
            message: "Authentication failed",
            cause: error,
          }),
  })

  if (result.isOk()) {
    return c.redirect(result.value, 302)
  }

  logger.error(`Auth callback error: ${result.error.message}`)
  return c.json({ error: "Authentication failed" }, 500)
})
