import { TaggedError } from "better-result"
import { Hono } from "hono"
import { getCookie, deleteCookie } from "hono/cookie"

import { logger } from "logger"

import { authClient } from "@/auth"

export class AuthCallbackError extends TaggedError("AuthCallbackError")<{
  message: string
  cause?: unknown
}>() {}

const appEnv = process.env["APP_ENV"] ?? "development"
const allowedOrigins =
  appEnv === "development"
    ? [
        process.env["WEB_ORIGIN"] ?? "http://localhost:3000",
        process.env["ADMIN_ORIGIN"] ?? "http://localhost:3001",
      ]
    : [
        process.env["WEB_ORIGIN"] ?? "",
        process.env["ADMIN_ORIGIN"] ?? "",
      ].filter(Boolean)
const defaultOrigin = allowedOrigins[0] ?? "http://localhost:3000"
const callbackUrl =
  process.env["AUTH_CALLBACK_URL"] ?? "http://localhost:4000/auth/callback"

export const authCallbackRoute = new Hono()

authCallbackRoute.get("/callback", async (c) => {
  const code = c.req.query("code")
  const error = c.req.query("error")
  const errorDescription = c.req.query("error_description")
  const redirectPath = c.req.query("redirect") ?? "/"

  const fullUrl = c.req.url
  logger.info(`Auth callback received: URL=${fullUrl}`)

  if (error) {
    logger.error(`OAuth error: ${error} - ${errorDescription}`)
    return c.json(
      { error: `OAuth error: ${error}`, description: errorDescription },
      400,
    )
  }

  if (!code) {
    logger.error(
      `Auth callback error: Missing code parameter. Query params: ${JSON.stringify(c.req.query())}`,
    )
    return c.json({ error: "Missing code parameter" }, 400)
  }

  const exchanged = await authClient.exchange(code, callbackUrl)

  if (exchanged.err) {
    logger.error(
      `Auth callback error: Token exchange failed: ${JSON.stringify(exchanged.err)}`,
    )
    return c.json({ error: "Authentication failed" }, 500)
  }

  logger.info(
    `Auth callback: Token exchange successful, redirecting to token exchange`,
  )

  const loginOrigin = getCookie(c, "login_origin")
  const origin =
    loginOrigin && allowedOrigins.includes(loginOrigin)
      ? loginOrigin
      : defaultOrigin

  const cookieDomain = process.env["COOKIE_DOMAIN"]
  deleteCookie(c, "login_origin", {
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  })

  // Redirect to token exchange page with tokens in URL
  const tokenExchangeUrl = `${origin}/auth/token?access=${encodeURIComponent(exchanged.tokens.access)}&refresh=${encodeURIComponent(exchanged.tokens.refresh)}&redirect=${encodeURIComponent(redirectPath)}`
  return c.redirect(tokenExchangeUrl, 302)
})
