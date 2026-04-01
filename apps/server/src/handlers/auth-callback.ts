import { TaggedError } from "better-result"
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

  const exchanged = await authClient.exchange(code, callbackUrl)

  if (exchanged.err) {
    logger.error(
      `Auth callback error: Token exchange failed: ${JSON.stringify(exchanged.err)}`,
    )
    return c.json({ error: "Authentication failed" }, 500)
  }

  setTokenCookies(c, exchanged.tokens.access, exchanged.tokens.refresh)

  const loginOrigin = getCookie(c, "login_origin")
  const origin =
    loginOrigin && allowedOrigins.includes(loginOrigin)
      ? loginOrigin
      : defaultOrigin
  deleteCookie(c, "login_origin", { path: "/" })

  return c.redirect(`${origin}${redirectPath}`, 302)
})
