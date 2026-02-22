import { authClient } from "@repo/auth/client"
import { subjects } from "@repo/auth/subjects"
import type { SessionUser } from "@repo/auth/types"
import { logger } from "@repo/logger"
import type { Context, MiddlewareHandler } from "hono"
import { getCookie, setCookie } from "hono/cookie"

export type { SessionUser }

interface SessionEnv {
  Variables: {
    session: SessionUser | null
  }
}

const appEnv = process.env["APP_ENV"] ?? "development"

const getCookieOptions = () => {
  if (appEnv === "production") {
    return {
      domain: process.env["COOKIE_DOMAIN"] ?? ".yopem.com",
      sameSite: "none" as const,
      secure: true,
      httpOnly: true,
      path: "/",
      maxAge: 34560000,
    }
  }
  return {
    sameSite: "lax" as const,
    httpOnly: true,
    path: "/",
    maxAge: 34560000,
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

  if (!accessToken) {
    c.set("session", null)
    return next()
  }

  try {
    const verified = await authClient.verify(subjects, accessToken, {
      refresh: refreshToken,
    })

    if (verified.err) {
      logger.error(`Token verification failed: ${JSON.stringify(verified.err)}`)
      c.set("session", null)
      return next()
    }

    if (verified.tokens) {
      setTokenCookies(c, verified.tokens.access, verified.tokens.refresh)
    }

    c.set("session", verified.subject.properties)
  } catch (err) {
    logger.error(
      `Auth middleware error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
    )
    c.set("session", null)
  }

  return next()
}

export { authClient, setTokenCookies, subjects }
