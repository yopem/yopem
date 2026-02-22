import { logger } from "@repo/logger"
import { Hono } from "hono"

import { authClient, setTokenCookies } from "@/auth"

const appEnv = process.env["APP_ENV"] ?? "development"
const webOrigin =
  appEnv === "development"
    ? "http://localhost:3000"
    : (process.env["WEB_ORIGIN"] ?? "")
const serverOrigin =
  appEnv === "development"
    ? "http://localhost:4000"
    : (process.env["NEXT_PUBLIC_API_URL"] ?? "")

export const authCallbackRoute = new Hono()

authCallbackRoute.get("/callback", async (c) => {
  const code = c.req.query("code")
  const redirectPath = c.req.query("redirect") ?? "/"

  if (!code) {
    return c.json({ error: "Missing code parameter" }, 400)
  }

  const callbackUrl = `${serverOrigin}/auth/callback`

  try {
    const exchanged = await authClient.exchange(code, callbackUrl)

    if (exchanged.err) {
      logger.error(`Token exchange failed: ${JSON.stringify(exchanged.err)}`)
      return c.json({ error: "Token exchange failed" }, 401)
    }

    setTokenCookies(c, exchanged.tokens.access, exchanged.tokens.refresh)

    const targetUrl = `${webOrigin}${redirectPath}`
    return c.redirect(targetUrl, 302)
  } catch (err) {
    logger.error(
      `Auth callback error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
    )
    return c.json({ error: "Authentication failed" }, 500)
  }
})
