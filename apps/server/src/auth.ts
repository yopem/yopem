import type { Context, MiddlewareHandler } from "hono"

import { Result } from "better-result"
import { getCookie, setCookie } from "hono/cookie"

import { authClient } from "auth/client"
import { subjects } from "auth/subjects"
import type { SessionUser } from "auth/types"
import { logger } from "logger"

export type { SessionUser }

interface SessionEnv {
  Variables: {
    session: SessionUser | null
  }
}

const isProduction = () => process.env["APP_ENV"] === "production"
const isSecure = () => {
  const cookieDomain = process.env["COOKIE_DOMAIN"]
  return !!cookieDomain || isProduction()
}

const getCookieOptions = () => {
  const cookieDomain = process.env["COOKIE_DOMAIN"]
  const prod = isProduction()
  return {
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    secure: isSecure(),
    httpOnly: true,
    path: "/",
    maxAge: 34560000,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  }
}

const setTokenCookies = (c: Context, access: string, refresh: string) => {
  const options = getCookieOptions()
  setCookie(c, "access_token", access, options)
  setCookie(c, "refresh_token", refresh, options)
}

export const authMiddleware: MiddlewareHandler<SessionEnv> = async (
  c,
  next,
) => {
  const accessToken = getCookie(c, "access_token")
  const refreshToken = getCookie(c, "refresh_token")

  logger.info(
    `Auth middleware: access_token=${accessToken ? "present" : "missing"}, refresh_token=${refreshToken ? "present" : "missing"}`,
  )

  if (!accessToken) {
    c.set("session", null)
    return next()
  }

  const result = await Result.tryPromise({
    try: async () => {
      const verified = await authClient.verify(subjects, accessToken, {
        refresh: refreshToken,
      })

      if (verified.err) {
        logger.error(
          `Token verification failed: ${JSON.stringify(verified.err)}`,
        )
        return null
      }

      if (verified.tokens) {
        setTokenCookies(c, verified.tokens.access, verified.tokens.refresh)
      }

      return verified.subject.properties
    },
    catch: (err) => {
      logger.error(
        `Auth middleware error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
      )
      return null
    },
  })

  c.set("session", result.isOk() ? result.value : null)
  return next()
}

export { authClient, setTokenCookies, subjects }
