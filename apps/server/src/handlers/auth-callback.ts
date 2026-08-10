import { Hono } from "hono"
import { getCookie } from "hono/cookie"
import { clearLoginOriginCookie, setSessionCookies } from "server/lib/cookies"

import { authClient } from "auth/client"
import { adminOrigin, authCallbackUrl, isDev, webOrigin } from "env"

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

const resolveRedirectPath = (query: string | undefined): string =>
  query !== undefined && isValidRedirectPath(query) ? query : "/"

export const resolveLoginOrigin = (
  loginOrigin: string | undefined,
  allowedOrigins: string[],
  defaultOrigin: string,
  queryRedirect: string,
): { origin: string; redirectPath: string } => {
  if (!loginOrigin) {
    return { origin: defaultOrigin, redirectPath: queryRedirect }
  }
  const matched = allowedOrigins.find(
    (o) => loginOrigin === o || loginOrigin.startsWith(`${o}/`),
  )
  if (!matched) {
    return { origin: defaultOrigin, redirectPath: queryRedirect }
  }
  const path = loginOrigin.slice(matched.length)
  return { origin: matched, redirectPath: path || queryRedirect }
}

export const authCallbackRoute = new Hono()

authCallbackRoute.get("/callback", async (c) => {
  const code = c.req.query("code")
  const error = c.req.query("error")
  const errorDescription = c.req.query("error_description")

  console.info(`Auth callback received: URL=${c.req.url}`)

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

  const { origin, redirectPath } = resolveLoginOrigin(
    getCookie(c, "login_origin"),
    allowedOrigins,
    defaultOrigin,
    resolveRedirectPath(c.req.query("redirect")),
  )

  clearLoginOriginCookie(c)

  setSessionCookies(c, exchanged.tokens.access, exchanged.tokens.refresh)

  return c.redirect(`${origin}${redirectPath}`, 302)
})
