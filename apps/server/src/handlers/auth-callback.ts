import { TaggedError } from "better-result"
import { Hono } from "hono"
import { getCookie, deleteCookie, setCookie } from "hono/cookie"

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

const isValidRedirectPath = (path: string): boolean => {
  if (!path.startsWith("/")) return false
  if (path.startsWith("//")) return false
  if (path.includes("://")) return false
  return true
}

export const authCallbackRoute = new Hono()

authCallbackRoute.get("/callback", async (c) => {
  const code = c.req.query("code")
  const error = c.req.query("error")
  const errorDescription = c.req.query("error_description")
  const redirectPath = isValidRedirectPath(c.req.query("redirect") ?? "/")
    ? (c.req.query("redirect") ?? "/")
    : "/"

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
  const prod = appEnv === "production"
  const isSecure = !!cookieDomain || prod
  deleteCookie(c, "login_origin", {
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  })

  const cookieOptions = {
    httpOnly: true,
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    secure: isSecure,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }

  setCookie(c, "access_token", exchanged.tokens.access, {
    ...cookieOptions,
    maxAge: 86400,
  })
  setCookie(c, "refresh_token", exchanged.tokens.refresh, {
    ...cookieOptions,
    maxAge: 604800,
  })

  return c.redirect(`${origin}${redirectPath}`, 302)
})
