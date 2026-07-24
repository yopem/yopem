import { Hono } from "hono"
import { getCookie, deleteCookie, setCookie } from "hono/cookie"

import { authClient } from "auth/client"
import {
  adminOrigin,
  authCallbackUrl,
  cookieDomain,
  isDev,
  isProd,
  webOrigin,
} from "env"

const allowedOrigins = isDev
  ? [
      webOrigin ?? "http://localhost:3000",
      adminOrigin ?? "http://localhost:3001",
    ]
  : [webOrigin, adminOrigin].filter(Boolean)

const defaultOrigin = allowedOrigins[0] ?? "http://localhost:3000"
const callbackUrl = authCallbackUrl ?? "http://localhost:4000/auth/callback"

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
  console.info(`Auth callback received: URL=${fullUrl}`)

  if (error) {
    console.error(`OAuth error: ${error} - ${errorDescription}`)
    return c.json(
      { error: `OAuth error: ${error}`, description: errorDescription },
      400,
    )
  }

  if (!code) {
    console.error(
      `Auth callback error: Missing code parameter. Query params: ${JSON.stringify(c.req.query())}`,
    )
    return c.json({ error: "Missing code parameter" }, 400)
  }

  const exchanged = await authClient.exchange(code, callbackUrl)

  if (exchanged.err) {
    console.error(
      `Auth callback error: Token exchange failed: ${JSON.stringify(exchanged.err)}`,
    )
    return c.json({ error: "Authentication failed" }, 500)
  }

  console.info(
    `Auth callback: Token exchange successful, redirecting to token exchange`,
  )

  const loginOrigin = getCookie(c, "login_origin")
  const origin =
    loginOrigin && allowedOrigins.includes(loginOrigin)
      ? loginOrigin
      : defaultOrigin

  const isSecure = !!cookieDomain || isProd
  deleteCookie(c, "login_origin", {
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  })

  const sameSite: "none" | "lax" = isDev ? "lax" : "none"
  const cookieOptions = {
    httpOnly: true,
    sameSite,
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
